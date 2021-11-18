use crate::ast::{
    ARITHMETIC_EXPRESSION_LHS, ARITHMETIC_EXPRESSION_RHS, ASSIGNMENT_STATEMENT_LHS,
    ASSIGNMENT_STATEMENT_RHS, CLASS_EXTENDS, CLASS_FIELD_TYPE, CONSTRUCTOR_CALL_EXPRESSION_SOURCE,
    ELSE_IF_STATEMENT_BODY, ELSE_IF_STATEMENT_CONDITION, ELSE_STATEMENT_BODY, FUNCTION_BODY,
    FUNCTION_CALL_EXPRESSION_SOURCE, FUNCTION_RETURN, IF_STATEMENT_BODY, IF_STATEMENT_CONDITION,
    INDEX_EXPRESSION_INDEX, INDEX_EXPRESSION_SOURCE, LOCAL_DEFINITION_STATEMENT_INITIALIZER,
    LOCAL_DEFINITION_STATEMENT_TYPE, RAW_POINTER_TYPE_INNER, RETURN_STATEMENT_EXPRESSION,
    SIMPLE_STATEMENT_EXPRESSION, SPECIFIED_TYPE_BASE, THROW_STATEMENT_EXPRESSION, TYPE_DEFINITION,
    WHILE_STATEMENT_BODY, WHILE_STATEMENT_CONDITION,
};

use super::{ASTElement, ASTElementKind};

pub fn pretty_print(source: ASTElement) -> String {
    match &source.element() {
        ASTElementKind::ArithmeticExpression { operator, .. } => format!(
            "({}) {} ({})",
            pretty_print(source.slot(ARITHMETIC_EXPRESSION_LHS).unwrap()),
            operator,
            pretty_print(source.slot(ARITHMETIC_EXPRESSION_RHS).unwrap())
        ),

        ASTElementKind::AssignmentStatement { .. } => format!(
            "{} = {};",
            pretty_print(source.slot(ASSIGNMENT_STATEMENT_LHS).unwrap()),
            pretty_print(source.slot(ASSIGNMENT_STATEMENT_RHS).unwrap())
        ),

        ASTElementKind::Class { span: _, name } => format!(
            "/* path: {} */\nclass {}{} {{\n{}\n}}",
            source.path(),
            name,
            match source.slot(CLASS_EXTENDS) {
                Some(extends) => " extends ".to_string() + &pretty_print(extends.clone()),
                None => "".to_string(),
            },
            textwrap::indent(
                &source
                    .slots_normal()
                    .into_iter()
                    .map(|(_, el)| pretty_print(el))
                    .collect::<Vec<String>>()
                    .join("\n"),
                "    "
            )
        ),

        ASTElementKind::ClassField { span: _, name } => {
            format!(
                "{} {};",
                pretty_print(source.slot(CLASS_FIELD_TYPE).unwrap()),
                name
            )
        }

        ASTElementKind::CompoundStatement { span: _ } => {
            format!(
                "{{\n{}\n}}",
                textwrap::indent(
                    &source
                        .slot_vec()
                        .into_iter()
                        .map(|el| pretty_print(el))
                        .collect::<Vec<String>>()
                        .join("\n"),
                    "    "
                )
            )
        }

        ASTElementKind::ConstructorCallExpression { .. } => {
            format!(
                "new {}({})",
                pretty_print(source.slot(CONSTRUCTOR_CALL_EXPRESSION_SOURCE).unwrap()),
                source
                    .slot_vec()
                    .into_iter()
                    .map(pretty_print)
                    .collect::<Vec<String>>()
                    .join(", ")
            )
        }

        ASTElementKind::ElseStatement { .. } => format!(
            "else {}",
            pretty_print(source.slot(ELSE_STATEMENT_BODY).unwrap())
        ),

        ASTElementKind::ElseIfStatement { .. } => format!(
            "else if {} {}",
            pretty_print(source.slot(ELSE_IF_STATEMENT_CONDITION).unwrap()),
            pretty_print(source.slot(ELSE_IF_STATEMENT_BODY).unwrap())
        ),

        ASTElementKind::FFICallExpression { span: _, name } => {
            format!(
                "fficall {}({})",
                name,
                source
                    .slot_vec()
                    .into_iter()
                    .map(pretty_print)
                    .collect::<Vec<String>>()
                    .join(", ")
            )
        }

        ASTElementKind::Function {
            span: _,
            is_static,
            name,
            unique_name,
        } => format!(
            "/* path: {} */\n{}fn {} {} /* = {} */ ({}){} {}",
            source.path(),
            match is_static {
                true => "static ",
                false => "",
            },
            source
                .slot(FUNCTION_RETURN)
                .map_or("NO RETURN?!".to_string(), pretty_print),
            unique_name,
            name,
            source
                .slots_normal()
                .into_iter()
                .map(|(name, el)| format!("{} {}", pretty_print(el), name))
                .collect::<Vec<String>>()
                .join(", "),
            if source.var_slot_idx() > 0 {
                " throws ".to_string()
                    + &source
                        .slot_vec()
                        .into_iter()
                        .map(|el| format!("{}", pretty_print(el)))
                        .collect::<Vec<String>>()
                        .join(", ")
            } else {
                "".to_string()
            },
            source
                .slot(FUNCTION_BODY)
                .map_or(";".to_string(), pretty_print)
        ),

        ASTElementKind::FunctionCallExpression { .. } => {
            format!(
                "{}({})",
                pretty_print(source.slot(FUNCTION_CALL_EXPRESSION_SOURCE).unwrap()),
                source
                    .slot_vec()
                    .into_iter()
                    .map(pretty_print)
                    .collect::<Vec<String>>()
                    .join(", ")
            )
        }

        ASTElementKind::IfStatement { .. } => format!(
            "if {} {}",
            pretty_print(source.slot(IF_STATEMENT_CONDITION).unwrap()),
            pretty_print(source.slot(IF_STATEMENT_BODY).unwrap())
        ),

        ASTElementKind::IndexExpression { .. } => format!(
            "{}[{}]",
            pretty_print(source.slot(INDEX_EXPRESSION_SOURCE).unwrap()),
            pretty_print(source.slot(INDEX_EXPRESSION_INDEX).unwrap())
        ),

        ASTElementKind::Interface { span: _, name } => format!(
            "/* path: {} */\ninterface {} {{\n{}\n}}",
            source.path(),
            name,
            textwrap::indent(
                &source
                    .slots_normal()
                    .into_iter()
                    .map(|(_, el)| pretty_print(el))
                    .collect::<Vec<String>>()
                    .join("\n"),
                "    "
            )
        ),

        ASTElementKind::LocalDefinitionStatement { name, .. } => format!(
            "let {} {} = {};",
            pretty_print(source.slot(LOCAL_DEFINITION_STATEMENT_TYPE).unwrap()),
            name,
            pretty_print(source.slot(LOCAL_DEFINITION_STATEMENT_INITIALIZER).unwrap())
        ),

        ASTElementKind::MacroCallExpression { span: _, name } => {
            format!(
                "{}!({})",
                name,
                source
                    .slot_vec()
                    .into_iter()
                    .map(pretty_print)
                    .collect::<Vec<String>>()
                    .join(", ")
            )
        }

        ASTElementKind::Module { name: _ } => {
            let header = format!("/* module: {} */\n\n", source.path());

            header
                + &source
                    .slots_normal()
                    .into_iter()
                    .map(|(_, el)| pretty_print(el))
                    .collect::<Vec<String>>()
                    .join("\n\n")
        }

        ASTElementKind::NameExpression { span: _, name } => format!("{}", name),

        ASTElementKind::NewType { name } => format!(
            "type {}{};",
            name,
            match source.slot(TYPE_DEFINITION) {
                Some(definition) => format!(" = {}", pretty_print(definition.clone())),
                None => " /* undefined */".to_string(),
            }
        ),

        ASTElementKind::NumberExpression { span: _, value } => format!("{}", value),

        ASTElementKind::RawPointerType { .. } => {
            format!(
                "*{}",
                pretty_print(source.slot(RAW_POINTER_TYPE_INNER).unwrap())
            )
        }

        ASTElementKind::ReturnStatement { .. } => format!(
            "return {};",
            source
                .slot(RETURN_STATEMENT_EXPRESSION)
                .map_or("".to_string(), pretty_print)
        ),

        ASTElementKind::SimpleStatement { .. } => {
            format!(
                "{};",
                pretty_print(source.slot(SIMPLE_STATEMENT_EXPRESSION).unwrap())
            )
        }

        ASTElementKind::SpecifiedType { .. } => {
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

        ASTElementKind::StringExpression { span: _, value } => format!("{}", value),

        ASTElementKind::ThrowStatement { .. } => {
            format!(
                "throw {};",
                pretty_print(source.slot(THROW_STATEMENT_EXPRESSION).unwrap())
            )
        }

        ASTElementKind::UnresolvedIdentifier {
            span: _,
            name,
            namespace,
        } => format!("/* unresolved {} */ {}", namespace, name),

        ASTElementKind::WhileStatement { .. } => format!(
            "while {} {}",
            pretty_print(source.slot(WHILE_STATEMENT_CONDITION).unwrap()),
            pretty_print(source.slot(WHILE_STATEMENT_BODY).unwrap())
        ),

        ASTElementKind::Placeholder() => "/* placeholder */".to_owned(),
    }
}
