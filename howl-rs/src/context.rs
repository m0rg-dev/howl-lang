use std::{
    cell::RefCell,
    collections::HashMap,
    error::Error,
    fs,
    path::{Path, PathBuf},
};

use lrlex::{lrlex_mod, LRNonStreamingLexer, LRNonStreamingLexerDef};
use lrpar::{LexParseError, NonStreamingLexer};

use crate::{
    ast::{
        arena::{ASTArena, ASTHandle},
        pretty_print::pretty_print,
        ASTElement, ASTElementKind,
    },
    log,
    logger::{LogLevel, Logger},
    parser::CSTElement,
};

lrlex_mod!("howl.l");
lrlex_mod!("howl.y");

pub struct CompilationContext {
    arena: ASTArena,
    root_module: ASTHandle,
    lexer_def: LRNonStreamingLexerDef<u32>,
    sources: HashMap<PathBuf, String>,
    errors: RefCell<Vec<CompilationError>>,
}

#[derive(Clone)]
pub struct CompilationError {
    source_path: PathBuf,
    span: lrpar::Span,
    headline: String,
    description: Option<String>,
}

impl CompilationContext {
    fn lexer_for(&self, source_path: &Path) -> LRNonStreamingLexer<'_, '_, u32> {
        self.lexer_def
            .lexer(&self.sources.get(source_path.into()).unwrap())
    }

    pub fn add_error(&self, item: CompilationError) {
        self.errors.borrow_mut().push(item);
    }

    pub fn errors(&self) -> Vec<CompilationError> {
        self.errors.borrow().to_vec()
    }

    pub fn new() -> CompilationContext {
        let arena = ASTArena::new();
        let root_module = arena.insert(ASTElement::new(ASTElementKind::Module {
            name: "".to_string(),
        }));

        CompilationContext {
            arena,
            root_module,
            lexer_def: howl_l::lexerdef(),
            sources: HashMap::new(),
            errors: RefCell::new(Vec::new()),
        }
    }

    pub fn compile_from(&mut self, source_path: &Path, prefix: &str) -> Result<(), Box<dyn Error>> {
        log!(
            LogLevel::Info,
            "Compiling: {} ({})",
            prefix,
            source_path.to_string_lossy()
        );

        let src = fs::read_to_string(source_path)?;
        self.sources.insert(source_path.into(), src);

        let (cst, parse_errors) = howl_y::parse(&self.lexer_for(source_path));

        parse_errors.iter().for_each(|x| {
            self.add_error(match x {
                LexParseError::LexError(e) => CompilationError {
                    source_path: source_path.to_owned(),
                    span: e.span(),
                    headline: "Lex error".to_string(),
                    description: None,
                },
                LexParseError::ParseError(e) => CompilationError {
                    source_path: source_path.to_owned(),
                    span: e.lexeme().span(),
                    headline: "Parse error".to_string(),
                    description: None,
                },
            })
        });

        if parse_errors.len() == 0 {
            for el in cst.unwrap().unwrap() {
                self.parse_cst(el, &prefix);
            }
        }

        Ok(())
    }

    pub fn print_error(&self, e: &CompilationError) {
        let lexer = self.lexer_for(&e.source_path);
        let ((start_line, start_col), (end_line, end_col)) = lexer.line_col(e.span);
        eprintln!(
            "\x1b[1;31merror\x1b[0m: {}, {}:{}: \x1b[1m{}\x1b[0m",
            e.source_path.to_string_lossy(),
            start_line,
            start_col,
            e.headline
        );

        let lines_str = lexer.span_lines_str(e.span);
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

    pub fn dump(&self) {
        eprintln!("{}", pretty_print(self.root_module.clone()));
    }

    pub fn path_set(&self, path: &str, element: ASTElement) -> ASTHandle {
        let mut components: Vec<&str> = path.split(".").collect();
        let last = components.pop().unwrap();
        let parent = self.path_create(&components.join("."));
        ASTElement::slot_insert(&self.arena, &parent, last, element)
    }

    pub fn path_create(&self, path: &str) -> ASTHandle {
        self.path_create_rec(self.root_module.clone(), path)
    }

    fn path_create_rec(&self, root_module: ASTHandle, path: &str) -> ASTHandle {
        let components: Vec<&str> = path.split(".").collect();
        let slot_contents = { root_module.as_ref().slot(components[0]) };
        let submodule = match slot_contents {
            Some(el) => el,
            None => {
                let new_element = ASTElement::new(ASTElementKind::Module {
                    name: components[0].to_string(),
                });

                ASTElement::slot_insert(&self.arena, &root_module, components[0], new_element)
            }
        };
        if components.len() > 1 {
            self.path_create_rec(submodule, &components[1..].join("."))
        } else {
            submodule
        }
    }

    fn parse_cst(&self, cst: CSTElement, prefix: &str) -> ASTHandle {
        match cst {
            CSTElement::Class {
                span,
                header:
                    CSTElement::ClassHeader {
                        span: _,
                        name: CSTElement::Identifier { span: _, name },
                        ..
                    },
                body: CSTElement::ClassBody { span: _, elements },
            } => {
                let class_path = prefix.to_owned() + "." + name;
                let class = self.path_set(
                    &class_path,
                    ASTElement::new(ASTElementKind::Class {
                        span,
                        name: name.clone(),
                    }),
                );

                for element in elements {
                    self.parse_cst(element.clone(), &class_path);
                }

                class
            }

            CSTElement::ClassField {
                span,
                fieldname: CSTElement::Identifier { span: _, name },
                fieldtype,
            } => self.path_set(
                &(prefix.to_owned() + "." + name),
                ASTElement::new(ASTElementKind::ClassField {
                    span,
                    name: name.to_owned(),
                    type_ref: self.parse_cst(fieldtype.clone(), prefix),
                }),
            ),

            CSTElement::BaseType { span, name } => {
                self.arena
                    .insert(ASTElement::new(ASTElementKind::UnresolvedIdentifier {
                        span,
                        name,
                    }))
            }

            _ => {
                log!(LogLevel::Warning, "unimplemented parse_cst {:?}", cst);
                self.arena
                    .insert(ASTElement::new(ASTElementKind::Placeholder()))
            }
        }
    }
}
