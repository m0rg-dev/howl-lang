use std::collections::HashSet;

use crate::{
    ast::{
        pretty_print::pretty_print, ASTElement, ASTElementKind, CLASS_FIELD_TYPE,
        CONSTRUCTOR_CALL_EXPRESSION_SOURCE, FIELD_REFERENCE_EXPRESSION_SOURCE,
        FUNCTION_CALL_EXPRESSION_SOURCE, FUNCTION_RETURN, LOCAL_DEFINITION_STATEMENT_TYPE,
        SPECIFIED_TYPE_BASE, TEMPORARY_SOURCE, TYPE_DEFINITION,
    },
    context::{get_parent_scope, CompilationContext, CompilationError},
    log,
    logger::LogLevel,
};

lazy_static! {
    static ref BASE_TYPES: HashSet<String> = {
        let mut s = HashSet::new();
        s.insert("__any".to_string());
        s.insert("__number".to_string());
        s.insert("void".to_string());
        s.insert("bool".to_string());
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

pub fn process_ast_transforms(
    ctx: &CompilationContext,
    mut root_element: ASTElement,
) -> ASTElement {
    root_element = add_self_to_functions(root_element);
    root_element = resolve_names(ctx, root_element);
    root_element = add_self_to_method_calls(ctx, root_element);
    root_element
}

fn add_self_to_functions(root_element: ASTElement) -> ASTElement {
    root_element.transform(root_element.path(), &|_path, el| match el.element() {
        ASTElementKind::Function { span, .. } => {
            // TODO what if it's static
            el.slot_insert(
                "self",
                ASTElement::new(ASTElementKind::NamedType {
                    span,
                    abspath: el.parent().unwrap().path(),
                }),
            );
            el
        }
        _ => el,
    })
}

fn resolve_names(ctx: &CompilationContext, root_element: ASTElement) -> ASTElement {
    root_element.transform(root_element.path(), &|_path, el| match el.element() {
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

fn add_self_to_method_calls(ctx: &CompilationContext, root_element: ASTElement) -> ASTElement {
    root_element.transform(root_element.path(), &|_path, el| {
        match el.element() {
            ASTElementKind::FunctionCallExpression { span } => {
                // be vewy, vewy quiet! I'm hunting method calls

                // alright this is kind of a hack and we should probably do it right...
                // anyways, static methods called directly by name (source is a NameExpression)
                // rewrites: .foo.bar.baz(arg1, arg2) => (.foo.bar).baz(.foo.bar, arg1, arg2)
                if let Some(ASTElementKind::NameExpression {
                    name,
                    span: name_span,
                }) = el
                    .slot(FUNCTION_CALL_EXPRESSION_SOURCE)
                    .map(|x| x.element())
                {
                    log!(
                        LogLevel::Trace,
                        "  static method call by name: {}",
                        pretty_print(el.clone())
                    );
                    let mut parts: Vec<&str> = name.split(".").collect();
                    let last = parts.pop().unwrap();
                    let rest = parts.join(".");

                    // we don't have to build a temporary here because the source class is immutable
                    let new_self = ASTElement::new(ASTElementKind::NameExpression {
                        name: rest,
                        span: name_span.clone(),
                    });

                    let new_function_source =
                        ASTElement::new(ASTElementKind::FieldReferenceExpression {
                            name: last.to_string(),
                            span: name_span.clone(),
                        });
                    // clone_tree is not totally necessary here but we're trying
                    // to keep the T in AST (otherwise we refer to new_self
                    // twice). TODO should this be enforced somehow?
                    new_function_source
                        .slot_insert(FIELD_REFERENCE_EXPRESSION_SOURCE, new_self.clone_tree());

                    let new_function_call =
                        ASTElement::new(ASTElementKind::FunctionCallExpression { span });
                    new_function_call
                        .slot_insert(FUNCTION_CALL_EXPRESSION_SOURCE, new_function_source);
                    // push self as first argument
                    new_function_call.slot_push(new_self.clone());
                    // push old args over
                    el.slot_vec().into_iter().for_each(|x| {
                        new_function_call.slot_push(x);
                    });
                    process_ast_transforms(ctx, new_function_call)
                } else if let Some(ASTElementKind::FieldReferenceExpression {
                    name,
                    span: field_ref_span,
                }) = el
                    .slot(FUNCTION_CALL_EXPRESSION_SOURCE)
                    .map(|x| x.element())
                {
                    // if it's not static, it's a "normal" method call of some
                    // sort (where the source is a field reference).
                    // We may have to use $(source) as self if the method is
                    // static, but we'll get that after the method call is
                    // resolved.

                    let source_temporary = ASTElement::new(ASTElementKind::Temporary {
                        name: uuid::Uuid::new_v4().to_simple().to_string(),
                    });
                    source_temporary.slot_insert(
                        TEMPORARY_SOURCE,
                        el.slot(FUNCTION_CALL_EXPRESSION_SOURCE)
                            .unwrap()
                            .slot(FIELD_REFERENCE_EXPRESSION_SOURCE)
                            .unwrap(),
                    );

                    let source_reference =
                        ASTElement::new(ASTElementKind::FieldReferenceExpression {
                            span: field_ref_span,
                            name,
                        });
                    source_reference
                        .slot_insert(FIELD_REFERENCE_EXPRESSION_SOURCE, source_temporary.clone());

                    let new_function_call =
                        ASTElement::new(ASTElementKind::FunctionCallExpression { span });
                    new_function_call
                        .slot_insert(FUNCTION_CALL_EXPRESSION_SOURCE, source_reference);
                    new_function_call.slot_push(source_temporary);
                    el.slot_vec().into_iter().for_each(|x| {
                        new_function_call.slot_push(x);
                    });
                    process_ast_transforms(ctx, new_function_call)
                } else {
                    el
                }
            }
            _ => el,
        }
    })
}

macro_rules! basetype {
    ($span: expr, $name: expr) => {
        Some(ASTElement::new(ASTElementKind::NamedType {
            span: $span,
            abspath: $name.to_string(),
        }))
    };
}

pub fn get_type_for_expression(
    ctx: &CompilationContext,
    element: ASTElement,
) -> Option<ASTElement> {
    match element.element() {
        // TODO
        ASTElementKind::ArithmeticExpression { span, .. } => basetype!(span, "__any"),
        ASTElementKind::AssignmentStatement { .. } => None,
        ASTElementKind::Class { .. } => Some(element),
        ASTElementKind::ClassField { .. } => element
            .slot(CLASS_FIELD_TYPE)
            .map(|field| get_type_for_expression(ctx, field))
            .flatten(),
        ASTElementKind::CompoundStatement { .. } => None,
        ASTElementKind::ConstructorCallExpression { .. } => element
            .slot(CONSTRUCTOR_CALL_EXPRESSION_SOURCE)
            .map(|source| get_type_for_expression(ctx, source))
            .flatten(),
        ASTElementKind::ElseIfStatement { .. } => None,
        ASTElementKind::ElseStatement { .. } => None,
        ASTElementKind::FFICallExpression { span, .. } => basetype!(span, "__any"),
        ASTElementKind::FieldReferenceExpression { name, .. } => element
            .slot(FIELD_REFERENCE_EXPRESSION_SOURCE)
            .map(|source| get_type_for_expression(ctx, source))
            .flatten()
            .map(|source_type| source_type.slot(&name))
            .flatten()
            .map(|field| get_type_for_expression(ctx, field))
            .flatten(),
        ASTElementKind::Function { .. } => Some(element),
        ASTElementKind::FunctionCallExpression { .. } => element
            .slot(FUNCTION_CALL_EXPRESSION_SOURCE)
            .map(|source| get_type_for_expression(ctx, source))
            .flatten()
            .map(|source_type| source_type.slot(FUNCTION_RETURN))
            .flatten(),
        ASTElementKind::IfStatement { .. } => None,
        // TODO
        ASTElementKind::IndexExpression { span, .. } => basetype!(span, "__any"),
        ASTElementKind::Interface { .. } => Some(element),
        ASTElementKind::LocalDefinitionStatement { .. } => element
            .slot(LOCAL_DEFINITION_STATEMENT_TYPE)
            .map(|source| get_type_for_expression(ctx, source))
            .flatten(),
        // TODO
        ASTElementKind::MacroCallExpression { span, .. } => basetype!(span, "__any"),
        ASTElementKind::Module { .. } => Some(element),
        ASTElementKind::NamedType { abspath, .. } => {
            if BASE_TYPES.contains(&abspath) {
                Some(element)
            } else {
                ctx.path_get(&element, &abspath)
            }
        }
        ASTElementKind::NameExpression { name, .. } => ctx
            .path_get(&element, &name)
            .map(|x| get_type_for_expression(ctx, x))
            .flatten(),
        ASTElementKind::NewType { .. } => element
            .slot(TYPE_DEFINITION)
            .map(|source| get_type_for_expression(ctx, source))
            .flatten(),
        ASTElementKind::NumberExpression { span, .. } => basetype!(span, "__number"),
        ASTElementKind::RawPointerType { .. } => Some(element),
        ASTElementKind::ReturnStatement { .. } => None,
        ASTElementKind::SimpleStatement { .. } => None,
        // TODO
        ASTElementKind::SpecifiedType { .. } => element
            .slot(SPECIFIED_TYPE_BASE)
            .map(|source| get_type_for_expression(ctx, source))
            .flatten(),
        ASTElementKind::StaticTableReference { .. } => Some(element),
        // TODO
        ASTElementKind::StringExpression { .. } => None,
        ASTElementKind::Temporary { .. } => element
            .slot(TEMPORARY_SOURCE)
            .map(|source| get_type_for_expression(ctx, source))
            .flatten(),
        ASTElementKind::ThrowStatement { .. } => None,
        ASTElementKind::WhileStatement { .. } => None,
        ASTElementKind::UnresolvedIdentifier { .. } => unimplemented!("{:?}", element.element()),
        ASTElementKind::UnresolvedMethod { .. } => Some(element),
        ASTElementKind::Placeholder() => unimplemented!("{:?}", element.element()),
    }
}

// fn get_type_for_path(
//     context: &CompilationContext,
//     relative_to: &ASTElement,
//     path: &str,
// ) -> Option<ASTElement> {
//     log!(LogLevel::Trace, "get_type_for_path {}", path);
//     context
//         .path_get(relative_to, path)
//         .map(|x| match x.element() {
//             ASTElementKind::LocalDefinitionStatement { .. } => {
//                 x.slot(LOCAL_DEFINITION_STATEMENT_TYPE)
//             }
//             ASTElementKind::Class { span, .. } => {
//                 Some(ASTElement::new(ASTElementKind::NamedType {
//                     span,
//                     abspath: path.to_string(),
//                 }))
//             }
//             _ => Some(x),
//         })
//         .flatten()
// }

fn find_variable(context: &CompilationContext, source: &ASTElement, name: &str) -> Option<String> {
    // Try to find it in an enclosing scope.
    let mut current = get_parent_scope(source.to_owned());
    let mut parts = vec!["__parent_scope".to_string()];
    while current.is_some() {
        let current_element = current.as_ref().unwrap().clone();
        // it's a function or something. easy
        if let Some(_) = current_element.slot(name) {
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
        current = get_parent_scope(current.unwrap().parent().unwrap());
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
            self_path.append(&mut search_path(&source.parent().unwrap()));
            self_path
        }
        ASTElementKind::Interface { .. } => {
            let mut self_path = vec!["__class_scope".to_string()];
            self_path.append(&mut search_path(&source.parent().unwrap()));
            self_path
        }
        _ => search_path(&source.parent().unwrap()),
    }
}
