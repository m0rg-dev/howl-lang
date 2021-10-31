use crate::ast::{
    CLASS_EXTENDS, CLASS_FIELD_TYPE, FUNCTION_RETURN, RAW_POINTER_TYPE_INNER, SPECIFIED_TYPE_BASE,
    TYPE_DEFINITION,
};

use super::{ASTElementKind, ASTHandle};

pub fn pretty_print(source: ASTHandle) -> String {
    let parts: Vec<String> = source
        .as_ref()
        .slots()
        .iter()
        .map(|x| pretty_print(source.as_ref().slot(x).unwrap()))
        .collect();

    match &source.as_ref().element {
        ASTElementKind::Module { name: _ } => {
            let header = format!("/* module: {} */\n\n", source.as_ref().path());

            header + &parts.join("\n\n")
        }

        ASTElementKind::Class { span: _, name } => format!(
            "/* path: {} */\nclass {}{} {{\n{}\n}}",
            source.as_ref().path(),
            name,
            match source.as_ref().slot(CLASS_EXTENDS) {
                Some(extends) => " extends ".to_string() + &pretty_print(extends.clone()),
                None => "".to_string(),
            },
            textwrap::indent(&parts.join("\n"), "    ")
        ),

        ASTElementKind::ClassField { span: _, name } => {
            format!(
                "{} {};",
                pretty_print(source.as_ref().slot(CLASS_FIELD_TYPE).unwrap()),
                name
            )
        }

        ASTElementKind::Function {
            span: _,
            is_static,
            name,
        } => format!(
            "{}fn {} {}() {{}}",
            match is_static {
                true => "static ",
                false => "",
            },
            pretty_print(source.as_ref().slot(FUNCTION_RETURN).unwrap()),
            name
        ),

        ASTElementKind::NewType { name } => format!(
            "type {}{};",
            name,
            match source.as_ref().slot(TYPE_DEFINITION) {
                Some(definition) => format!(" = {}", pretty_print(definition.clone())),
                None => " /* undefined */".to_string(),
            }
        ),

        ASTElementKind::RawPointerType { span: _ } => {
            format!(
                "*{}",
                pretty_print(source.as_ref().slot(RAW_POINTER_TYPE_INNER).unwrap())
            )
        }

        ASTElementKind::SpecifiedType { span: _ } => {
            format!(
                "{}<{}>",
                pretty_print(source.as_ref().slot(SPECIFIED_TYPE_BASE).unwrap()),
                source
                    .as_ref()
                    .slot_vec()
                    .iter()
                    .map(|x| pretty_print(x.clone()))
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
