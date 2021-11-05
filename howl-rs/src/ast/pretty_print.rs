use crate::ast::{
    CLASS_EXTENDS, CLASS_FIELD_TYPE, FUNCTION_RETURN, RAW_POINTER_TYPE_INNER, SPECIFIED_TYPE_BASE,
    TYPE_DEFINITION,
};

use super::{ASTElement, ASTElementKind};

pub fn pretty_print(source: ASTElement) -> String {
    let parts: Vec<String> = source
        .slots()
        .into_iter()
        .map(|(_, el)| pretty_print(el))
        .collect();

    match &source.element() {
        ASTElementKind::Module { name: _ } => {
            let header = format!("/* module: {} */\n\n", source.path());

            header + &parts.join("\n\n")
        }

        ASTElementKind::Class { span: _, name } => format!(
            "/* path: {} */\nclass {}{} {{\n{}\n}}",
            source.path(),
            name,
            match source.slot(CLASS_EXTENDS) {
                Some(extends) => " extends ".to_string() + &pretty_print(extends.clone()),
                None => "".to_string(),
            },
            textwrap::indent(&parts.join("\n"), "    ")
        ),

        ASTElementKind::ClassField { span: _, name } => {
            format!(
                "{} {};",
                pretty_print(source.slot(CLASS_FIELD_TYPE).unwrap()),
                name
            )
        }

        ASTElementKind::Function {
            span: _,
            is_static,
            name,
        } => format!(
            "{}fn {} {}({}) {{}}",
            match is_static {
                true => "static ",
                false => "",
            },
            source
                .slot(FUNCTION_RETURN)
                .map_or("NO RETURN?!".to_string(), pretty_print),
            name,
            source
                .slots()
                .into_iter()
                .filter(|(name, _)| name != FUNCTION_RETURN)
                .map(|(name, el)| format!("{} {}", pretty_print(el), name))
                .collect::<Vec<String>>()
                .join(", ")
        ),

        ASTElementKind::NewType { name } => format!(
            "type {}{};",
            name,
            match source.slot(TYPE_DEFINITION) {
                Some(definition) => format!(" = {}", pretty_print(definition.clone())),
                None => " /* undefined */".to_string(),
            }
        ),

        ASTElementKind::RawPointerType { span: _ } => {
            format!(
                "*{}",
                pretty_print(source.slot(RAW_POINTER_TYPE_INNER).unwrap())
            )
        }

        ASTElementKind::SpecifiedType { span: _ } => {
            format!(
                "{}<{}>",
                pretty_print(source.slot(SPECIFIED_TYPE_BASE).unwrap()),
                source
                    .slot_vec()
                    .into_iter()
                    .map(pretty_print)
                    .collect::<Vec<String>>()
                    .join(", ")
            )
        }

        ASTElementKind::UnresolvedIdentifier {
            span: _,
            name,
            namespace,
        } => format!("/* unresolved {} */ {}", namespace, name),
        ASTElementKind::Placeholder() => "/* placeholder */".to_owned(),
    }
}
