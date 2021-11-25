use std::collections::HashSet;

use crate::{
    ast::{
        ASTElement, ASTElementKind, CLASS_FIELD_TYPE, CONSTRUCTOR_CALL_EXPRESSION_SOURCE,
        FIELD_REFERENCE_EXPRESSION_SOURCE, FUNCTION_CALL_EXPRESSION_SOURCE, FUNCTION_RETURN,
        LOCAL_DEFINITION_STATEMENT_TYPE, RAW_POINTER_TYPE_INNER, SPECIFIED_TYPE_BASE,
        TEMPORARY_SOURCE, TYPE_DEFINITION,
    },
    context::CompilationContext,
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

pub fn type_to_string(element: ASTElement) -> String {
    match element.element() {
        ASTElementKind::Class { .. } => format!("{}", element.path()),
        ASTElementKind::Interface { .. } => format!("{}", element.path()),
        ASTElementKind::NamedType { abspath, .. } => format!("{}", abspath),
        ASTElementKind::NewType { name, .. } => format!("'{}", name),
        ASTElementKind::RawPointerType { .. } => format!(
            "*{}",
            type_to_string(element.slot(RAW_POINTER_TYPE_INNER).unwrap())
        ),
        _ => unimplemented!("{:?}", element.element()),
    }
}
