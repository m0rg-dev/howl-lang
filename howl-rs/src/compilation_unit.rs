use std::{cell::RefCell, convert::TryInto, error::Error, fs, iter, path::PathBuf};

use cfgrammar::TIdx;
use lrlex::{lrlex_mod, LRNonStreamingLexer, LRNonStreamingLexerDef};
use lrpar::{LexParseError, NonStreamingLexer, ParseError, ParseRepair, Span};

use crate::{
    ast::{ASTElement, CSTMismatchError},
    logger::{LogLevel, Logger},
    transform::{assemble_statements, qualify_items},
};

lrlex_mod!("howl.l");
lrlex_mod!("howl.y");

#[derive(Clone)]
pub enum CompilationError {
    LexError(lrpar::LexError),
    ParseError(lrpar::ParseError<u32>),
    #[allow(dead_code)]
    ValidationError {
        span: lrpar::Span,
        description: String,
    },
}

pub struct CompilationUnit {
    source: String,
    lexerdef: LRNonStreamingLexerDef<u32>,
    pub root_module: String,
    pub source_path: Box<PathBuf>,
    items: RefCell<Vec<ASTElement>>,
    errors: RefCell<Vec<CompilationError>>,
}

impl CompilationUnit {
    fn lexer(&self) -> LRNonStreamingLexer<'_, '_, u32> {
        let lexer = self.lexerdef.lexer(&self.source);
        lexer
    }

    pub fn add_item(&self, item: ASTElement) {
        self.items.borrow_mut().push(item);
    }

    pub fn add_error(&self, item: CompilationError) {
        self.errors.borrow_mut().push(item);
    }

    pub fn errors(&self) -> Vec<CompilationError> {
        self.errors.borrow().to_vec()
    }

    pub fn items_mut(&self) -> std::cell::RefMut<'_, Vec<ASTElement>> {
        self.items.borrow_mut()
    }

    pub fn compile_from(
        source_path: &PathBuf,
        root_module: String,
    ) -> Result<CompilationUnit, Box<dyn Error>> {
        Logger::log(
            LogLevel::Info,
            &format!(
                "Compiling: {} ({})",
                root_module,
                source_path.to_string_lossy()
            ),
        );

        let src = fs::read_to_string(source_path)?;

        let cu = CompilationUnit {
            source: src,
            lexerdef: howl_l::lexerdef(),
            root_module,
            source_path: Box::new(source_path.to_path_buf()),
            items: RefCell::new(vec![]),
            errors: RefCell::new(vec![]),
        };

        let (cst, parse_errors) = howl_y::parse(&cu.lexer());

        parse_errors.iter().for_each(|x| {
            cu.add_error(match x {
                LexParseError::LexError(e) => CompilationError::LexError(*e),
                LexParseError::ParseError(e) => CompilationError::ParseError(e.clone()),
            })
        });

        if cu.errors().len() == 0 {
            // no lex / parse errors. we're free to start AST transformation
            if let Some(Ok(r)) = cst {
                r.iter().for_each(|e| {
                    let maybe_ast_el: Result<ASTElement, CSTMismatchError> =
                        e.to_owned().try_into();
                    match maybe_ast_el {
                        Ok(_) => {
                            cu.add_item(maybe_ast_el.unwrap());
                        }
                        Err(what) => {
                            println!("{:?}", what)
                        }
                    }
                });
            }
        }
        for item in &mut *cu.items_mut() {
            *item = apply_transforms(item.to_owned(), cu.root_module.clone(), &cu)
        }

        for e in &*cu.errors.borrow() {
            print_error(&cu, &e);
        }

        Ok(cu)
    }
}

fn apply_transforms(
    top_level: ASTElement,
    root_module: String,
    cu: &CompilationUnit,
) -> ASTElement {
    let mut e = top_level;
    e = assemble_statements(e, cu);
    e = qualify_items(e, root_module, cu);
    return e;
}

pub fn print_error(cu: &CompilationUnit, e: &CompilationError) {
    match e {
        CompilationError::LexError(e) => {
            let ((line, col), _) = cu.lexer().line_col(e.span());
            eprintln!("Lexing error at line {} column {}.", line, col);
            let line_str = cu
                .lexer()
                .span_lines_str(e.span())
                .split("\n")
                .next()
                .unwrap();
            eprintln!("    \x1b[32m{:>5}\x1b[0m \x1b[97m{}\x1b[0m", line, line_str);
            eprintln!("         {}\x1b[1;35m^ here\x1b[0m", " ".repeat(col));
        }
        CompilationError::ParseError(e) => {
            print_recovery(&cu.lexer(), e.clone());
        }
        CompilationError::ValidationError { span, description } => {
            let ((start_line, start_col), (end_line, end_col)) = cu.lexer().line_col(*span);
            eprintln!(
                "Validation error at line {} column {}: {}",
                start_line, start_col, description
            );
            let lines_str = cu.lexer().span_lines_str(*span);
            if start_line == end_line {
                eprintln!(
                    "    \x1b[32m{:>5}\x1b[0m \x1b[97m{}\x1b[0m",
                    start_line, lines_str
                );
                eprintln!(
                    "         {}\x1b[1;35m{}\x1b[0m",
                    " ".repeat(start_col),
                    "^".repeat(end_col - start_col)
                );
            } else {
                let lines_vec = lines_str.split("\n").collect::<Vec<&str>>();
                let (first_line, rest) = lines_vec.split_first().unwrap();
                let (last_line, rest) = rest.split_last().unwrap();

                let (first_line_before, first_line_after) = first_line.split_at(start_col - 1);
                let (last_line_before, last_line_after) = last_line.split_at(end_col - 1);

                eprintln!(
                    "    \x1b[32m{:>5}\x1b[0m {}\x1b[31m{}\x1b[0m",
                    start_line, first_line_before, first_line_after
                );
                rest.iter().enumerate().for_each(|(offset, line)| {
                    eprintln!(
                        "    \x1b[32m{:>5}\x1b[0m \x1b[31m{}\x1b[0m",
                        start_line + offset + 1,
                        line
                    )
                });
                eprintln!(
                    "    \x1b[32m{:>5}\x1b[0m \x1b[31m{}\x1b[0m{}",
                    end_line, last_line_before, last_line_after
                );
            }
        }
    }
}

fn print_recovery<'input>(lexer: &dyn NonStreamingLexer<'input, u32>, error: ParseError<u32>) {
    let ((line, col), _) = lexer.line_col(error.lexeme().span());
    eprintln!("Parsing error at line {} column {}:", line, col);
    let line_str = lexer
        .span_lines_str(error.lexeme().span())
        .split("\n")
        .next()
        .unwrap();
    eprintln!("    \x1b[32m{:>5}\x1b[0m \x1b[97m{}\x1b[0m", line, line_str);
    if error.repairs().len() > 0 {
        eprintln!("  Possible resolutions:");
        error
            .repairs()
            .iter()
            .for_each(|r| print_repair(lexer, r, line_str, col));
    } else {
        eprintln!(
            "         {}\x1b[1;35m^ parsing stopped here\x1b[0m",
            " ".repeat(col)
        );
        eprintln!("No potential repairs were identified.");
    }

    eprintln!("");
}

fn print_repair<'input>(
    lexer: &dyn NonStreamingLexer<'input, u32>,
    repair: &Vec<ParseRepair<u32>>,
    line: &str,
    start_col: usize,
) {
    let v: Vec<SpanBasedRepair<u32>> = Vec::new();
    let combined = repair.iter().fold(v, |a, b| match b {
        ParseRepair::Insert(_) => a
            .into_iter()
            .chain(iter::once(SpanBasedRepair::from(b.to_owned())))
            .collect(),
        ParseRepair::Delete(span_rhs) => {
            let length = a.len();
            let it = (&a).into_iter().cloned();
            let it2 = (&a).into_iter();
            match it2.last() {
                Some(&SpanBasedRepair::Delete(span_lhs)) => it
                    .take(length - 1)
                    .chain(iter::once(SpanBasedRepair::Delete(combine_spans(
                        &span_lhs,
                        &span_rhs.span(),
                    ))))
                    .collect(),
                Some(_) => it
                    .chain(iter::once(SpanBasedRepair::from(b.to_owned())))
                    .collect(),
                None => vec![SpanBasedRepair::from(b.to_owned())],
            }
        }
        ParseRepair::Shift(span_rhs) => {
            let length = a.len();
            let it = (&a).into_iter().cloned();
            let it2 = (&a).into_iter();
            match it2.last() {
                Some(&SpanBasedRepair::Shift(span_lhs)) => it
                    .take(length - 1)
                    .chain(iter::once(SpanBasedRepair::Shift(combine_spans(
                        &span_lhs,
                        &span_rhs.span(),
                    ))))
                    .collect(),
                Some(_) => it
                    .chain(iter::once(SpanBasedRepair::from(b.to_owned())))
                    .collect(),
                None => vec![SpanBasedRepair::from(b.to_owned())],
            }
        }
    });
    eprint!("          {}", &line[0..start_col - 1]);
    let mut end_col = start_col;
    let mut inserted_length = 0;
    combined.iter().for_each(|op| match op {
        SpanBasedRepair::Insert(tidx) => {
            eprint!("\x1b[1;36m{}\x1b[0m ", howl_y::token_epp(*tidx).unwrap());
            inserted_length += howl_y::token_epp(*tidx).unwrap().len() + 1;
        }
        SpanBasedRepair::Delete(span) => {
            eprint!("\x1b[31m{}\x1b[0m", lexer.span_str(*span));
            end_col += span.len();
        }
        SpanBasedRepair::Shift(span) => {
            eprint!("\x1b[97m{}\x1b[0m", lexer.span_str(*span));
            end_col += span.len();
        }
    });
    if end_col < line.len() {
        eprint!("{}", &line[end_col - 1..]);
    }
    eprintln!(
        "\n         {}\x1b[1;34m{}\x1b[0m",
        " ".repeat(start_col),
        "^".repeat(end_col - start_col + inserted_length)
    );
}

fn combine_spans(lhs: &Span, rhs: &Span) -> Span {
    return Span::new(lhs.start(), rhs.end());
}

#[derive(Debug, Clone)]
enum SpanBasedRepair<StorageT> {
    Insert(TIdx<StorageT>),
    Delete(Span),
    Shift(Span),
}

impl<T: std::hash::Hash + Copy> SpanBasedRepair<T> {
    fn from(src: ParseRepair<T>) -> SpanBasedRepair<T> {
        match src {
            ParseRepair::Insert(token) => SpanBasedRepair::Insert(token),
            ParseRepair::Delete(lexeme) => SpanBasedRepair::Delete(lexeme.span()),
            ParseRepair::Shift(lexeme) => SpanBasedRepair::Shift(lexeme.span()),
        }
    }
}
