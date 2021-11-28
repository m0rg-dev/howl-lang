use std::collections::HashSet;

use crate::{
    ast::{
        generate_unique_name_type, ASTElement, ASTElementKind, ARITHMETIC_EXPRESSION_LHS,
        ARITHMETIC_EXPRESSION_RHS, CLASS_FIELD_TYPE, CONSTRUCTOR_CALL_EXPRESSION_SOURCE,
        FIELD_REFERENCE_EXPRESSION_SOURCE, FUNCTION_CALL_EXPRESSION_SOURCE, FUNCTION_RETURN,
        LOCAL_DEFINITION_STATEMENT_TYPE, RAW_POINTER_TYPE_INNER, SPECIFIED_TYPE_BASE,
        TEMPORARY_SOURCE, TYPE_DEFINITION,
    },
    context::CompilationContext,
    log,
    logger::LogLevel,
};

lazy_static! {
    pub static ref BASE_TYPES: HashSet<String> = {
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
    dereference: bool,
) -> Option<ASTElement> {
    match element.element() {
        // TODO numeric-type-handling
        ASTElementKind::ArithmeticExpression { span, .. } => {
            let lhs = element
                .slot(ARITHMETIC_EXPRESSION_LHS)
                .map(|x| get_type_for_expression(ctx, x, dereference))
                .flatten();
            let rhs = element
                .slot(ARITHMETIC_EXPRESSION_RHS)
                .map(|x| get_type_for_expression(ctx, x, dereference))
                .flatten();

            match (lhs.map(|x| x.element()), rhs.map(|x| x.element())) {
                (
                    Some(ASTElementKind::NamedType {
                        abspath: lhsname, ..
                    }),
                    Some(ASTElementKind::NamedType {
                        abspath: rhsname, ..
                    }),
                ) => Some(ASTElement::new(ASTElementKind::NamedType {
                    span,
                    abspath: intersect_numerics(&lhsname, &rhsname),
                })),
                _ => None,
            }
        }
        ASTElementKind::AssignmentStatement { .. } => None,
        ASTElementKind::Class { .. } => Some(element),
        ASTElementKind::ClassField { .. } => element
            .slot(CLASS_FIELD_TYPE)
            .map(|field| get_type_for_expression(ctx, field, dereference))
            .flatten(),
        ASTElementKind::CompoundStatement { .. } => None,
        ASTElementKind::ConstructorCallExpression { .. } => element
            .slot(CONSTRUCTOR_CALL_EXPRESSION_SOURCE)
            .map(|source| get_type_for_expression(ctx, source, dereference))
            .flatten(),
        ASTElementKind::ElseIfStatement { .. } => None,
        ASTElementKind::ElseStatement { .. } => None,
        ASTElementKind::FFICallExpression { span, .. } => basetype!(span, "__any"),
        ASTElementKind::FieldReferenceExpression { name, .. } => element
            .slot(FIELD_REFERENCE_EXPRESSION_SOURCE)
            .map(|source| get_type_for_expression(ctx, source, dereference))
            .flatten()
            .map(|source_type| source_type.slot(&name))
            .flatten()
            .map(|field| get_type_for_expression(ctx, field, dereference))
            .flatten(),
        ASTElementKind::Function { .. } => Some(element),
        ASTElementKind::FunctionCallExpression { .. } => element
            .slot(FUNCTION_CALL_EXPRESSION_SOURCE)
            .map(|source| get_type_for_expression(ctx, source, dereference))
            .flatten()
            .map(|source_type| source_type.slot(FUNCTION_RETURN))
            .flatten()
            .map(|source| get_type_for_expression(ctx, source, dereference))
            .flatten(),
        ASTElementKind::IfStatement { .. } => None,
        // TODO
        ASTElementKind::IndexExpression { span, .. } => basetype!(span, "__any"),
        ASTElementKind::Interface { .. } => Some(element),
        ASTElementKind::LocalDefinitionStatement { .. } => element
            .slot(LOCAL_DEFINITION_STATEMENT_TYPE)
            .map(|source| get_type_for_expression(ctx, source, dereference))
            .flatten(),
        // TODO
        ASTElementKind::MacroCallExpression { span, .. } => basetype!(span, "__any"),
        ASTElementKind::Module { .. } => Some(element),
        ASTElementKind::NamedType { abspath, .. } => {
            if BASE_TYPES.contains(&abspath) {
                Some(element)
            } else if dereference {
                ctx.path_get(&element, &abspath)
                    .map(|source| get_type_for_expression(ctx, source, dereference))
                    .flatten()
            } else {
                ctx.path_get(&element, &abspath)
            }
        }
        ASTElementKind::NameExpression { name, .. } => ctx
            .path_get(&element, &name)
            .map(|x| get_type_for_expression(ctx, x, dereference))
            .flatten(),
        ASTElementKind::NewType { .. } => element
            .slot(TYPE_DEFINITION)
            .map(|source| get_type_for_expression(ctx, source, dereference))
            .flatten(),
        ASTElementKind::NumberExpression { span, .. } => basetype!(span, "__number"),
        ASTElementKind::RawPointerType { span, .. } => {
            let source_type = element
                .slot(RAW_POINTER_TYPE_INNER)
                .map(|source| get_type_for_expression(ctx, source, dereference))
                .flatten()?;

            let new_element = ASTElement::new(ASTElementKind::RawPointerType { span });
            // this has to be clone_tree otherwise we run into bidirectionality
            // errors later. TODO figure out how to make this less of a footgun
            new_element.slot_insert(RAW_POINTER_TYPE_INNER, source_type.clone_tree());

            Some(new_element)
        }
        ASTElementKind::ReturnStatement { .. } => None,
        ASTElementKind::SimpleStatement { .. } => None,
        ASTElementKind::SpecifiedType { .. } => {
            let source_type = element
                .slot(SPECIFIED_TYPE_BASE)
                .map(|source| get_type_for_expression(ctx, source, dereference))
                .flatten()?;
            let parts = source_type
                .path()
                .split(".")
                .map(|x| x.to_string())
                .collect::<Vec<String>>();
            let (last, rest) = parts.split_last().unwrap();
            let new_last = generate_unique_name_type(last, element.slot_vec());
            let new_path = rest.join(".") + "." + &new_last;

            if let Some(t) = ctx.path_get(&element, &new_path) {
                Some(t)
            } else {
                if let ASTElementKind::Class {
                    span,
                    name: _,
                    generic_order,
                } = source_type.element()
                {
                    let mut new_class = ASTElement::new(ASTElementKind::Class {
                        span: span.clone(),
                        name: new_last,
                        generic_order: vec![],
                    });
                    new_class.slot_clone(&source_type);
                    generic_order
                        .into_iter()
                        .enumerate()
                        .for_each(|(index, generic_slot)| {
                            let newtype = ASTElement::new(ASTElementKind::NewType {
                                name: generic_slot.clone(),
                            });
                            newtype.slot_insert(TYPE_DEFINITION, element.slot_vec()[index].clone());
                            new_class.slot_insert(&generic_slot, newtype);
                        });

                    ctx.path_set(&new_path.trim_start_matches("."), new_class.clone());
                    let self_type = ASTElement::new(ASTElementKind::NewType {
                        name: "__self".to_string(),
                    });

                    self_type.slot_insert(
                        TYPE_DEFINITION,
                        ASTElement::new(ASTElementKind::NamedType {
                            span: span.clone(),
                            abspath: new_class.path(),
                        }),
                    );

                    new_class.slot_insert("__self", self_type);

                    log!(
                        LogLevel::Trace,
                        "Monomorphized: {} <{}>",
                        new_path,
                        element
                            .slot_vec()
                            .into_iter()
                            .map(|x| type_to_string(x))
                            .collect::<Vec<String>>()
                            .join(", ")
                    );
                    Some(new_class)
                } else {
                    panic!();
                }
            }
        }
        ASTElementKind::StaticTableReference { .. } => Some(element),
        ASTElementKind::StringExpression { span, .. } => {
            let new_element =
                ASTElement::new(ASTElementKind::RawPointerType { span: span.clone() });
            new_element.slot_insert(
                RAW_POINTER_TYPE_INNER,
                ASTElement::new(ASTElementKind::NamedType {
                    span,
                    abspath: "u8".to_string(),
                }),
            );
            Some(new_element)
        }
        ASTElementKind::Temporary { .. } => element
            .slot(TEMPORARY_SOURCE)
            .map(|source| get_type_for_expression(ctx, source, dereference))
            .flatten(),
        ASTElementKind::ThrowStatement { .. } => None,
        ASTElementKind::WhileStatement { .. } => None,
        ASTElementKind::UnresolvedIdentifier { .. } => unimplemented!("{:?}", element.element()),
        ASTElementKind::UnresolvedMethod { .. } => Some(element),
        ASTElementKind::Placeholder() => unimplemented!("{:?}", element.element()),
    }
}

pub fn type_to_string(element: ASTElement) -> String {
    match element.element() {
        ASTElementKind::Class { .. } => format!("{}", element.path()),
        ASTElementKind::Interface { .. } => format!("{}", element.path()),
        ASTElementKind::Function { .. } => format!("{}", element.path()),
        ASTElementKind::NamedType { abspath, .. } => format!("'{}", abspath),
        ASTElementKind::NewType { name, .. } => format!("'{}", name),
        ASTElementKind::Module { .. } => format!("module {}", element.path()),
        ASTElementKind::RawPointerType { .. } => format!(
            "*{}",
            type_to_string(element.slot(RAW_POINTER_TYPE_INNER).unwrap())
        ),
        ASTElementKind::UnresolvedMethod { .. } => format!("#{}", element.path()),
        _ => unimplemented!("{:?}", element.element()),
    }
}

// TODO numeric-type-handling
fn intersect_numerics(a: &str, b: &str) -> String {
    if a == "__number" {
        return b.to_string();
    }

    if b == "__number" {
        return a.to_string();
    }

    a.to_string()
}

fn tc_reflexive(a: ASTElement, b: ASTElement) -> bool {
    // TODO is this valid?
    if a.path() == b.path() {
        return true;
    }

    let a_element = a.element();
    let b_element = b.element();

    if let ASTElementKind::NamedType {
        abspath: a_path, ..
    } = &a_element
    {
        if a_path == "__any" {
            return true;
        }
        if let ASTElementKind::NamedType {
            abspath: b_path, ..
        } = &b_element
        {
            // TODO numeric-type-handling
            if a_path == "__number" && BASE_TYPES.contains(b_path) {
                return true;
            }

            return a_path == b_path;
        }
    }

    if let (ASTElementKind::RawPointerType { .. }, ASTElementKind::RawPointerType { .. }) =
        (&a_element, &b_element)
    {
        return types_compatible(
            a.slot(RAW_POINTER_TYPE_INNER).unwrap(),
            b.slot(RAW_POINTER_TYPE_INNER).unwrap(),
        );
    }

    false
}

pub fn types_compatible(receiver: ASTElement, source: ASTElement) -> bool {
    log!(
        crate::logger::LogLevel::Trace,
        "  types_compatible {} {}",
        type_to_string(receiver.clone()),
        type_to_string(source.clone())
    );

    let r_element = receiver.element();
    let s_element = source.element();

    if let (ASTElementKind::Interface { .. }, ASTElementKind::Class { .. }) = (r_element, s_element)
    {
        if source.slot_vec().into_iter().any(|implementation| {
            if let ASTElementKind::NamedType { abspath, .. } = implementation.element() {
                abspath == receiver.path()
            } else {
                false
            }
        }) {
            return true;
        }
    }

    tc_reflexive(receiver.clone(), source.clone()) || tc_reflexive(source, receiver)
}
