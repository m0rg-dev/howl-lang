use crate::{
    ast::{
        pretty_print::pretty_print,
        types::{get_type_for_expression, type_to_string, types_compatible, BASE_TYPES},
        ASTElement, ASTElementKind, FIELD_REFERENCE_EXPRESSION_SOURCE,
        FUNCTION_CALL_EXPRESSION_SOURCE, TEMPORARY_SOURCE,
    },
    context::{get_parent_scope, CompilationContext, CompilationError},
    log,
    logger::LogLevel,
};

pub fn process_transforms_context(ctx: &mut CompilationContext) {
    ctx.root_module = add_self_to_functions(ctx.root_module.clone());
    ctx.root_module = resolve_names(ctx, ctx.root_module.clone());
    ctx.root_module = add_self_to_method_calls(ctx, ctx.root_module.clone());
    ctx.root_module = resolve_method_overloads(ctx, ctx.root_module.clone());
}

fn add_self_to_functions(root_element: ASTElement) -> ASTElement {
    root_element.transform(root_element.path(), &|_path, el| match el.element() {
        ASTElementKind::Function {
            span,
            is_static,
            name,
            unique_name,
            mut argument_order,
        } => {
            // TODO what if it's static
            el.slot_insert(
                "self",
                ASTElement::new(ASTElementKind::NamedType {
                    span: span.clone(),
                    abspath: el.parent().unwrap().path(),
                }),
            );

            let mut new_argument_order = vec!["self".to_string()];
            new_argument_order.append(&mut argument_order);

            let mut new_element = ASTElement::new(ASTElementKind::Function {
                span: span.clone(),
                is_static,
                name,
                unique_name,
                argument_order: new_argument_order,
            });

            new_element.slot_copy(&el);

            new_element
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

fn add_self_to_method_calls(_ctx: &CompilationContext, root_element: ASTElement) -> ASTElement {
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
                    new_function_call
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
                    new_function_call
                } else {
                    log!(
                        LogLevel::Warning,
                        "add_self_to_method_calls unexpected {}",
                        pretty_print(el.clone())
                    );
                    el
                }
            }
            _ => el,
        }
    })
}

fn resolve_method_overloads(ctx: &CompilationContext, root_element: ASTElement) -> ASTElement {
    root_element.transform(root_element.path(), &|_path, el| match el.element() {
        ASTElementKind::FunctionCallExpression { span } => {
            let source_element = el.slot(FUNCTION_CALL_EXPRESSION_SOURCE);
            if let Some(ASTElementKind::FieldReferenceExpression {
                name: fieldname,
                span: fieldspan,
            }) = source_element.map(|x| x.element())
            {
                let source_type = el
                    .slot(FUNCTION_CALL_EXPRESSION_SOURCE)
                    .unwrap()
                    .slot(FIELD_REFERENCE_EXPRESSION_SOURCE)
                    .map(|x| get_type_for_expression(ctx, x))
                    .flatten();

                log!(LogLevel::Trace, "Overload: {}", pretty_print(el.clone()));
                log!(
                    LogLevel::Trace,
                    "  Arguments: {}",
                    el.slot_vec()
                        .into_iter()
                        .map(|x| format!(
                            "{}",
                            get_type_for_expression(ctx, x)
                                .map_or("<no type>".to_string(), type_to_string)
                        ))
                        .collect::<Vec<String>>()
                        .join(", ")
                );

                if el
                    .slot_vec()
                    .into_iter()
                    .map(|x| get_type_for_expression(ctx, x))
                    .any(|t| t.is_none())
                {
                    ctx.add_error(CompilationError {
                        source_path: span.source_path,
                        span: span.span,
                        headline: format!("Missing type for argument"),
                        description: None,
                    });
                    return el;
                }

                let arg_types: Vec<ASTElement> = el
                    .slot_vec()
                    .into_iter()
                    .map(|x| get_type_for_expression(ctx, x).unwrap())
                    .collect();

                let mut candidates: Vec<ASTElement> = vec![];
                match source_type.as_ref().map(|x| x.element()) {
                    Some(ASTElementKind::Class { .. }) | Some(ASTElementKind::Interface { .. }) => {
                        source_type
                            .unwrap()
                            .slots()
                            .into_iter()
                            .for_each(|(_name, value)| {
                                if let ASTElementKind::Function {
                                    name,
                                    unique_name,
                                    argument_order,
                                    ..
                                } = value.element()
                                {
                                    if name == fieldname {
                                        log!(
                                            LogLevel::Trace,
                                            "  Candidate: {} {}",
                                            unique_name,
                                            argument_order
                                                .iter()
                                                .map(|k| {
                                                    format!(
                                                        "{} {}",
                                                        get_type_for_expression(
                                                            ctx,
                                                            value.slot(k).unwrap()
                                                        )
                                                        .map_or(
                                                            "<no type>".to_string(),
                                                            type_to_string
                                                        ),
                                                        k,
                                                    )
                                                })
                                                .collect::<Vec<String>>()
                                                .join(", ")
                                        );
                                        candidates.push(value.clone());
                                    }
                                }
                            });
                    }
                    _ => {
                        ctx.add_error(CompilationError {
                        source_path: span.source_path.clone(),
                        span: span.span,
                        headline:
                            "Attempt to call method on expression of non-class or interface type"
                                .to_string(),
                        description: Some(format!(
                            "  source was {} = {}",
                            pretty_print(el.slot(FUNCTION_CALL_EXPRESSION_SOURCE).unwrap()),
                            source_type.map_or("<no type>".to_string(), type_to_string)
                        )),
                    });
                    }
                }
                let matches = candidates
                    .iter()
                    .map(|x| x.clone())
                    .filter(|candidate| {
                        if let ASTElementKind::Function { argument_order, .. } = candidate.element()
                        {
                            argument_order.into_iter().enumerate().all(|(idx, slot)| {
                                types_compatible(
                                    get_type_for_expression(ctx, candidate.slot(&slot).unwrap())
                                        .unwrap(),
                                    arg_types[idx].clone(),
                                )
                            })
                        } else {
                            unreachable!();
                        }
                    })
                    .collect::<Vec<ASTElement>>();
                matches.iter().for_each(|candidate| {
                    if let ASTElementKind::Function {
                        unique_name,
                        argument_order,
                        ..
                    } = candidate.element()
                    {
                        log!(
                            LogLevel::Trace,
                            "  Match: {} {}",
                            unique_name,
                            argument_order
                                .into_iter()
                                .map(|k| {
                                    format!(
                                        "{} {}",
                                        get_type_for_expression(ctx, candidate.slot(&k).unwrap())
                                            .map_or("<no type>".to_string(), type_to_string),
                                        k,
                                    )
                                })
                                .collect::<Vec<String>>()
                                .join(", ")
                        );
                    } else {
                        unreachable!();
                    }
                });

                // alright now let's figure out what we got
                if matches.len() == 0 {
                    // nothing!
                    ctx.add_error(CompilationError {
                        source_path: span.source_path.clone(),
                        span: span.span,
                        headline: format!("No compatible overload found for {}", fieldname),
                        description: Some(format!(
                            "Provided arguments were: ({})\n{}",
                            arg_types
                                .iter()
                                .map(|x| type_to_string(x.clone()))
                                .collect::<Vec<String>>()
                                .join(", "),
                            candidates
                                .iter()
                                .map(|candidate| format!(
                                    "Candidate function:      ({})",
                                    if let ASTElementKind::Function { argument_order, .. } =
                                        candidate.element()
                                    {
                                        argument_order
                                            .iter()
                                            .map(|k| {
                                                format!(
                                                        "{}",
                                                        get_type_for_expression(
                                                            ctx,
                                                            candidate.slot(k).unwrap()
                                                        )
                                                        .map_or(
                                                            "<no type>".to_string(),
                                                            type_to_string
                                                        ),
                                                    )
                                            })
                                            .collect::<Vec<String>>()
                                            .join(", ")
                                    } else {
                                        unreachable!();
                                    }
                                ))
                                .collect::<Vec<String>>()
                                .join("\n"),
                        )),
                    })
                } else if matches.len() > 1 {
                    // too many!
                    ctx.add_error(CompilationError {
                        source_path: span.source_path.clone(),
                        span: span.span,
                        headline: format!("Multiple overloads found for {}", fieldname),
                        description: None,
                    });
                } else {
                    // alright now we can specify it
                    if let ASTElementKind::Function { unique_name, .. } = matches[0].element() {
                        let mut specified_call =
                            ASTElement::new(ASTElementKind::FunctionCallExpression { span });
                        let mut specified_fieldref =
                            ASTElement::new(ASTElementKind::FieldReferenceExpression {
                                span: fieldspan,
                                name: unique_name,
                            });
                        specified_fieldref
                            .slot_copy(&el.slot(FUNCTION_CALL_EXPRESSION_SOURCE).unwrap());
                        specified_call.slot_copy(&el);
                        specified_call
                            .slot_insert(FUNCTION_CALL_EXPRESSION_SOURCE, specified_fieldref);
                        return specified_call;
                    }
                }
            } else {
                todo!("you found a new error case");
            }

            el
        }
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
