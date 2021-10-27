use std::{
    collections::HashSet,
    iter::{self, FromIterator},
    rc::Rc,
};

use crate::{
    ast::{
        type_element::{self, TypeElement},
        ASTElement,
    },
    compilation_unit::{CompilationError, CompilationErrorKind, CompilationUnit, Identifier},
    context::Context,
    log,
    logger::{LogLevel, Logger},
};

use super::map_ast;

pub trait Resolver {
    fn lookup(&self, name: String) -> Option<Identifier>;
}

struct ChainResolver {
    source: Box<dyn Resolver>,
    fallback: Box<dyn Resolver>,
}

impl ChainResolver {
    /// Returns a new ChainResolver that will check `source` for a given name,
    /// and if that `source` returns `None` it will return the same name looked
    /// up via `fallback`.
    ///
    /// ChainResolvers can be nested.
    fn new(source: Box<dyn Resolver>, fallback: Box<dyn Resolver>) -> ChainResolver {
        ChainResolver { source, fallback }
    }

    /// Returns a new ChainResolver with `first_resort` prepended to the
    /// `fallback` chain.
    ///
    /// In other words, if you have a ChainResolver (a, (b c)) and call
    /// add_2nd(..., d) on it, you'll get (a, (d, (b, c))). Useful to keep the
    /// default BaseTypeResolver at the top.
    fn add_2nd(source: ChainResolver, first_resort: Box<dyn Resolver>) -> ChainResolver {
        ChainResolver {
            source: source.source,
            fallback: Box::new(ChainResolver::new(first_resort, source.fallback)),
        }
    }
}

impl Resolver for ChainResolver {
    fn lookup(&self, name: String) -> Option<Identifier> {
        self.source
            .lookup(name.clone())
            .or_else(|| self.fallback.lookup(name.clone()))
    }
}

pub struct TopLevelResolver {
    search_path: Vec<String>,
    classes: HashSet<String>,
    interfaces: HashSet<String>,
    functions: HashSet<String>,
}

impl TopLevelResolver {
    pub fn new(context: &Context, search_path: Vec<String>) -> TopLevelResolver {
        TopLevelResolver {
            search_path: search_path.clone(),
            classes: HashSet::from_iter(context.classes.iter().map(|x| x.name().clone())),
            interfaces: HashSet::from_iter(context.interfaces.iter().map(|x| x.name().clone())),
            functions: HashSet::from_iter(context.functions.iter().map(|x| x.name().clone())),
        }
    }
}

impl Resolver for TopLevelResolver {
    fn lookup(&self, name: String) -> Option<Identifier> {
        for candidate in iter::once(name.clone())
            .chain(self.search_path.iter().map(|x| x.clone() + "." + &name))
            .collect::<Vec<String>>()
        {
            if self.classes.contains(&candidate) {
                return Some(Identifier::Class(candidate.clone()));
            }

            if self.interfaces.contains(&candidate) {
                return Some(Identifier::Interface(candidate.clone()));
            }

            if self.functions.contains(&candidate) {
                return Some(Identifier::Function(candidate.clone()));
            }
        }

        None
    }
}

pub struct BaseTypeResolver {
    base_types: HashSet<String>,
}

impl BaseTypeResolver {
    pub fn new() -> BaseTypeResolver {
        BaseTypeResolver {
            base_types: HashSet::from_iter(
                vec!["i8", "i16", "i32", "i64", "u8", "u16", "u32", "u64", "void"]
                    .iter()
                    .map(|x| x.to_string()),
            ),
        }
    }
}

impl Resolver for BaseTypeResolver {
    fn lookup(&self, name: String) -> Option<Identifier> {
        if self.base_types.contains(&name) {
            return Some(Identifier::Type(TypeElement::BaseType {
                span: lrpar::Span::new(0, 0),
                name: name.clone(),
            }));
        }

        None
    }
}

pub fn default_resolver(ctx: &Context, cu: &CompilationUnit) -> Box<dyn Resolver> {
    Box::new(ChainResolver::new(
        Box::new(BaseTypeResolver::new()),
        Box::new(TopLevelResolver::new(ctx, vec![cu.root_module.clone()])),
    ))
}

pub fn resolve_names(
    source: ASTElement,
    ctx: &Context,
    cu: Rc<CompilationUnit>,
    resolver: Rc<Box<dyn Resolver>>,
) -> ASTElement {
    match source {
        ASTElement::Type(crate::ast::type_element::TypeElement::BaseType { span, ref name }) => {
            let resolved = resolver.lookup(name.to_string());
            log!(
                LogLevel::Trace,
                "Type to resolve: {} => {:?}",
                name,
                resolved
            );
            if let Some(resolution) = resolved {
                match resolution {
                    Identifier::Class(name) => {
                        ASTElement::Type(TypeElement::BaseType { span, name })
                    }
                    Identifier::Interface(name) => {
                        ASTElement::Type(TypeElement::BaseType { span, name })
                    }
                    Identifier::Type(type_element) => ASTElement::Type(type_element),
                    _ => source,
                }
            } else {
                // ctx.add_error(CompilationError {
                //     cu: cu.clone(),
                //     error: CompilationErrorKind::ValidationError {
                //         span,
                //         description: format!("Unknown type `{}'", name),
                //     },
                // });
                source
            }
        }
        ASTElement::Expression(crate::ast::expression_element::ExpressionElement::Name {
            span: _,
            ref name,
        }) => {
            Logger::log(LogLevel::Trace, &format!("Name to resolve: {}", name));
            source
        }
        _ => map_ast(source, |e| {
            resolve_names(e, ctx, cu.clone(), resolver.clone())
        }),
    }
}
