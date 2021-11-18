use std::collections::HashSet;

use crate::{
    ast::{ASTElement, ASTElementKind},
    context::{CompilationContext, CompilationError},
};

lazy_static! {
    static ref BASE_TYPES: HashSet<String> = {
        let mut s = HashSet::new();
        s.insert("void".to_string());
        s.insert("u8".to_string());
        s.insert("u16".to_string());
        s.insert("u32".to_string());
        s.insert("u64".to_string());
        s.insert("i8".to_string());
        s.insert("i16".to_string());
        s.insert("i32".to_string());
        s.insert("i64".to_string());
        s
    };
}

pub fn resolve_names(ctx: &CompilationContext) -> ASTElement {
    ctx.root_module
        .transform("".to_string(), &|_path, el| match el.element() {
            ASTElementKind::UnresolvedIdentifier {
                span,
                name,
                namespace,
            } => match namespace.as_str() {
                "type" => {
                    if BASE_TYPES.contains(&name) {
                        ASTElement::new(ASTElementKind::NamedType {
                            span,
                            abspath: name,
                        })
                    } else {
                        for target in search_path(&el) {
                            if let Some(_) = ctx.path_get(&el, &(target.clone() + "." + &name)) {
                                return ASTElement::new(ASTElementKind::NamedType {
                                    span,
                                    abspath: target + "." + &name,
                                });
                            }
                        }

                        // if we got here, we didn't find it
                        ctx.add_error(CompilationError {
                            source_path: span.source_path,
                            span: span.span,
                            headline: format!("Unknown type: {}", name),
                            description: None,
                        });

                        el
                    }
                }
                _ => {
                    for target in search_path(&el) {
                        if let Some(_) = ctx.path_get(&el, &(target.clone() + "." + &name)) {
                            return ASTElement::new(ASTElementKind::NamedType {
                                span,
                                abspath: target + "." + &name,
                            });
                        }
                    }

                    // if we got here, we didn't find it
                    ctx.add_error(CompilationError {
                        source_path: span.source_path,
                        span: span.span,
                        headline: format!("Unknown name: {}", name),
                        description: None,
                    });

                    el
                }
            },
            _ => el,
        })
}

fn search_path(source: &ASTElement) -> Vec<String> {
    match source.element() {
        ASTElementKind::Module { searchpath, .. } => searchpath.clone(),
        ASTElementKind::Class { .. } => {
            let mut self_path = vec!["self".to_string()];
            self_path.append(&mut search_path(&source.parent()));
            self_path
        }
        ASTElementKind::Interface { .. } => {
            let mut self_path = vec!["self".to_string()];
            self_path.append(&mut search_path(&source.parent()));
            self_path
        }
        _ => search_path(&source.parent()),
    }
}
