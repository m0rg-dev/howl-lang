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
    ast::{ASTArena, ASTElement, ASTElementKind, ASTHandle},
    log,
    logger::{LogLevel, Logger},
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
        let root_module = arena.insert(ASTElement::new(
            None,
            ASTElementKind::Module {
                name: "root".to_string(),
            },
        ));

        CompilationContext {
            arena,
            root_module,
            lexer_def: howl_l::lexerdef(),
            sources: HashMap::new(),
            errors: RefCell::new(Vec::new()),
        }
    }

    pub fn compile_from(
        &mut self,
        source_path: &Path,
        prefix: String,
    ) -> Result<(), Box<dyn Error>> {
        log!(
            LogLevel::Info,
            "Compiling: {} ({})",
            prefix,
            source_path.to_string_lossy()
        );

        let src = fs::read_to_string(source_path)?;
        self.sources.insert(source_path.into(), src);

        let (_cst, parse_errors) = howl_y::parse(&self.lexer_for(source_path));

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
            let p = self.root_module.clone();
            #[allow(unreachable_patterns)]
            match self.root_module.as_cloned().element {
                ASTElementKind::Module { .. } => {
                    let submodule = ASTElement::new(
                        Some(p),
                        ASTElementKind::Module {
                            name: prefix.clone(),
                        },
                    );

                    ASTElement::slot_insert(&self.arena, &self.root_module, &prefix, submodule);
                }
                _ => unreachable!(),
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
        eprintln!("{:#?}", self.root_module);
    }
}

/*

pub struct Context {
    files: Vec<Rc<CompilationUnit>>,
    pub classes: Vec<ClassElement>,
    pub interfaces: Vec<InterfaceElement>,
    pub functions: Vec<FunctionElement>,

    pub names_types: RefCell<HashMap<String, Identifier>>,
    pub names_objects: RefCell<HashMap<String, Identifier>>,

    errors: RefCell<Vec<CompilationError>>,
}

impl Context {
    pub fn new() -> Context {
        Context {
            files: vec![],
            classes: vec![],
            interfaces: vec![],
            functions: vec![],
            names_types: RefCell::new(HashMap::new()),
            names_objects: RefCell::new(HashMap::new()),
            errors: RefCell::new(vec![]),
        }
    }

    pub fn add_error(&self, item: CompilationError) {
        self.errors.borrow_mut().push(item);
    }

    pub fn ingest_file(&mut self, path: &Path, root_module: String) -> Result<(), Box<dyn Error>> {
        let cu = CompilationUnit::compile_from(path, root_module)?;
        self.errors.borrow_mut().append(&mut cu.errors());
        self.files.push(cu);
        Ok(())
    }

    fn add_names_from(&self, parent_path: String, item: &ASTElement) {
        match item {
            ASTElement::Class(c) => {
                log!(LogLevel::Trace, "Adding name:  object {}", c.name());
                log!(LogLevel::Trace, "Adding name:    type {}", c.name());
                self.names_objects
                    .borrow_mut()
                    .insert(c.name().clone(), Identifier::Class(c.name().clone()));
                self.names_types
                    .borrow_mut()
                    .insert(c.name().clone(), Identifier::Class(c.name().clone()));

                for g in c.generics() {
                    log!(LogLevel::Trace, "Adding name:    type {}.{}", c.name(), g);
                    self.names_types.borrow_mut().insert(
                        c.name().to_owned() + "." + &g,
                        Identifier::Type(TypeElement::BaseType {
                            span: lrpar::Span::new(0, 0),
                            name: c.name().to_owned() + "." + &g,
                        }),
                    );
                }

                for m in c.methods() {
                    log!(
                        LogLevel::Trace,
                        "Adding name:  object {}.{}",
                        c.name(),
                        m.name()
                    );
                }
            }
            ASTElement::Interface(i) => {
                log!(LogLevel::Trace, "Adding name:  object {}", i.name());
                log!(LogLevel::Trace, "Adding name:    type {}", i.name());
                self.names_objects
                    .borrow_mut()
                    .insert(i.name().clone(), Identifier::Class(i.name().clone()));
                self.names_types
                    .borrow_mut()
                    .insert(i.name().clone(), Identifier::Class(i.name().clone()));

                for g in i.generics() {
                    log!(LogLevel::Trace, "Adding name:    type {}.{}", i.name(), g);
                    self.names_types.borrow_mut().insert(
                        i.name().to_owned() + "." + &g,
                        Identifier::Type(TypeElement::BaseType {
                            span: lrpar::Span::new(0, 0),
                            name: i.name().to_owned() + "." + &g,
                        }),
                    );
                }

                for m in i.methods() {
                    log!(
                        LogLevel::Trace,
                        "Adding name:  object {}.{}",
                        i.name(),
                        m.name()
                    );
                }
            }
            _ => {}
        };
    }

    pub fn compile_whole_program(&mut self) {
        for cu in &self.files {
            cu.apply_transform(|i| assemble_statements(i, self, cu.clone()));

            for item in cu.items() {
                self.add_names_from(cu.root_module.clone(), &item);
                match item {
                    ASTElement::Class(c) => {
                        log!(LogLevel::Trace, "Loaded class:        {}", c.name());
                        self.classes.push(c)
                    }
                    ASTElement::Interface(i) => {
                        Logger::log(
                            LogLevel::Trace,
                            &format!("Loaded interface:    {}", i.name()),
                        );
                        self.interfaces.push(i)
                    }
                    ASTElement::Function(f) => {
                        Logger::log(
                            LogLevel::Trace,
                            &format!("Loaded function:     {}", f.name()),
                        );
                        self.functions.push(f)
                    }
                    _ => unreachable!(),
                }
            }
        }

        // for cu in &self.files {
        //     cu.apply_transform(|i| {
        //         resolve_names(i, self, cu.clone(), Rc::new(default_resolver(&self, cu)))
        //     });
        // }

        self.errors.borrow().iter().for_each(|e| print_error(e));
    }
}

*/
