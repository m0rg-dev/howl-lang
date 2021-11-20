use std::collections::HashSet;

use crate::{
    ast::{
        pretty_print::pretty_print, ASTElement, ASTElementKind, FIELD_REFERENCE_EXPRESSION_SOURCE,
        LOCAL_DEFINITION_STATEMENT_TYPE,
    },
    context::{get_parent_scope, CompilationContext, CompilationError},
    log,
    logger::LogLevel,
    logger::Logger,
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

pub fn add_self_to_functions(ctx: &CompilationContext) -> ASTElement {
    ctx.root_module
        .transform("".to_string(), &|_path, el| match el.element() {
            ASTElementKind::Function { span, .. } => {
                // TODO what if it's static
                el.slot_insert(
                    "self",
                    ASTElement::new(ASTElementKind::NamedType {
                        span,
                        abspath: el.parent().path(),
                    }),
                );
                el
            }
            _ => el,
        })
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
                        if let Some(abspath) = find_name(ctx, &el, &name) {
                            return ASTElement::new(ASTElementKind::NamedType { span, abspath });
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
                "variable" => {
                    let mut parts: Vec<&str> = name.split(".").collect();
                    let mut fields: Vec<&str> = vec![];
                    while parts.len() > 0 {
                        let candidate = parts.join(".");
                        if let Some(name_part) = find_variable(ctx, &el, &candidate) {
                            let mut rc = ASTElement::new(ASTElementKind::NameExpression {
                                span: span.clone(),
                                name: name_part,
                            });

                            while fields.len() > 0 {
                                let new_rc =
                                    ASTElement::new(ASTElementKind::FieldReferenceExpression {
                                        span: span.clone(),
                                        name: fields[fields.len() - 1].to_string(),
                                    });
                                new_rc.slot_insert(FIELD_REFERENCE_EXPRESSION_SOURCE, rc);
                                rc = new_rc;
                                fields.pop();
                            }

                            return rc;
                        }
                        fields.push(parts.pop().unwrap());
                    }

                    // if we got here, we didn't find it. diagnose based on the first component
                    // TODO this highlights the whole possibly.qualified.name
                    ctx.add_error(CompilationError {
                        source_path: span.source_path,
                        span: span.span,
                        headline: format!(
                            "Unknown name: {}",
                            name.split(".").collect::<Vec<&str>>()[0]
                        ),
                        description: None,
                    });

                    el
                }
                _ => {
                    if let Some(abspath) = find_name(ctx, &el, &name) {
                        return ASTElement::new(ASTElementKind::NamedType { span, abspath });
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

fn find_variable(context: &CompilationContext, source: &ASTElement, name: &str) -> Option<String> {
    // Try to find it in an enclosing scope.
    let mut current = get_parent_scope(source.to_owned());
    let mut parts = vec!["__parent_scope".to_string()];
    while current.is_some() {
        let current_element = current.as_ref().unwrap().clone();
        // it's a function or something. easy
        if current_element.slot(name).is_some() {
            return Some(parts.join(".") + "." + name);
        }
        // it's a CompoundStatement and we need to find the *correct* LocalDefinitionStatement
        // TODO this does not find the correct LocalDefinitionStatement
        if let ASTElementKind::CompoundStatement { .. } = current_element.element() {
            for (index, statement) in current_element.slot_vec().iter().enumerate() {
                if let ASTElementKind::LocalDefinitionStatement { name: def_name, .. } =
                    statement.element()
                {
                    if def_name == name {
                        return Some(parts.join(".") + "." + &index.to_string());
                    }
                }
            }
        }
        current = get_parent_scope(current.unwrap().parent());
        parts.push("__parent_scope".to_string());
    }

    // Nope. Maybe an absolute path?
    find_name(context, source, name)
}

fn find_name(context: &CompilationContext, source: &ASTElement, name: &str) -> Option<String> {
    for target in search_path(&source) {
        if let Some(_) = context.path_get(&source, &(target.clone() + "." + &name)) {
            return Some(target.clone() + "." + &name);
        }
    }
    None
}

// Find the search path used by a given ASTElement.
fn search_path(source: &ASTElement) -> Vec<String> {
    match source.element() {
        ASTElementKind::Module { searchpath, .. } => searchpath.clone(),
        ASTElementKind::Class { .. } => {
            let mut self_path = vec!["__class_scope".to_string()];
            self_path.append(&mut search_path(&source.parent()));
            self_path
        }
        ASTElementKind::Interface { .. } => {
            let mut self_path = vec!["__class_scope".to_string()];
            self_path.append(&mut search_path(&source.parent()));
            self_path
        }
        _ => search_path(&source.parent()),
    }
}
