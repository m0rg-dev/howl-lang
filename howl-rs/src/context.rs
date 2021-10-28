use std::{
    cell::RefCell,
    collections::{HashMap, HashSet},
    error::Error,
    path::Path,
    rc::Rc,
};

use crate::{
    ast::{
        class_element::ClassElement, function_element::FunctionElement,
        interface_element::InterfaceElement, type_element::TypeElement, ASTElement,
    },
    compilation_unit::{print_error, CompilationError, CompilationUnit, Identifier},
    log,
    logger::{LogLevel, Logger},
    transform::{
        assemble_statements,
        resolve_names::{default_resolver, resolve_names},
    },
};

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
