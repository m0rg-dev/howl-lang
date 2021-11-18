use crate::{
    ast::{ASTElement, ASTElementKind},
    context::CompilationContext,
    Cli,
};

pub fn output_graphviz(ctx: &CompilationContext, args: &Cli) {
    println!("digraph {{");
    println!("  rankdir=LR;");
    ctx.root_module.transform("".to_string(), &|path, el| {
        if args.graphviz_filter.is_some()
            && !(path.starts_with(args.graphviz_filter.as_ref().unwrap()))
        {
            return el;
        }
        match el.element() {
            _ => {
                let mut slots_sorted = el.slots();
                slots_sorted.sort_by(|a, b| a.0.cmp(&b.0));
                println!(
                    "  n_{} [shape=record label=\"{} {}\"];",
                    el.handle(),
                    sanitize(headline(&el)),
                    slots_sorted
                        .iter()
                        .map(|(slot, _)| format!(" | <{}>{}", slot, slot))
                        .collect::<Vec<String>>()
                        .join("")
                );
                el.slots().iter().for_each(|(slot, contents)| {
                    println!("  n_{}:{} -> n_{}", el.handle(), slot, contents.handle())
                });
            }
        };
        el
    });
    println!("}}");
}

fn headline(el: &ASTElement) -> String {
    match el.element() {
        ASTElementKind::ArithmeticExpression { operator, .. } => {
            format!("ArithmeticExpression {}", operator)
        }
        ASTElementKind::AssignmentStatement { .. } => format!("AssignmentStatement"),
        ASTElementKind::Class { .. } => format!("Class {}", el.path()),
        ASTElementKind::ClassField { name, .. } => format!("ClassField {}", name),
        ASTElementKind::ConstructorCallExpression { .. } => format!("ConstructorCallExpression"),
        ASTElementKind::CompoundStatement { .. } => format!("CompoundStatement"),
        ASTElementKind::FFICallExpression { name, .. } => format!("FFICallExpression {}", name),
        ASTElementKind::Function { name, .. } => format!("Function {} ({})", el.path(), name),
        ASTElementKind::FunctionCallExpression { .. } => format!("FunctionCallExpression"),
        ASTElementKind::IfStatement { .. } => format!("IfStatement"),
        ASTElementKind::ElseIfStatement { .. } => format!("ElseIfStatement"),
        ASTElementKind::ElseStatement { .. } => format!("ElseStatement"),
        ASTElementKind::IndexExpression { .. } => format!("IndexExpression"),
        ASTElementKind::Interface { .. } => format!("Interface {}", el.path()),
        ASTElementKind::LocalDefinitionStatement { name, .. } => {
            format!("LocalDefinitionStatement {}", name)
        }
        ASTElementKind::MacroCallExpression { name, .. } => format!("MacroCallExpression {}", name),
        ASTElementKind::Module { .. } => format!("Module {}", el.path()),
        ASTElementKind::NamedType { abspath, .. } => format!("Type {}", abspath),
        ASTElementKind::NameExpression { name, .. } => format!("Name {}", name),
        ASTElementKind::NumberExpression { value, .. } => format!("Number {}", value),
        ASTElementKind::NewType { name, .. } => format!("NewType {}", name),
        ASTElementKind::Placeholder() => format!("Placeholder"),
        ASTElementKind::RawPointerType { .. } => format!("RawPointerType"),
        ASTElementKind::ReturnStatement { .. } => format!("ReturnStatement"),
        ASTElementKind::SimpleStatement { .. } => format!("SimpleStatement"),
        ASTElementKind::SpecifiedType { .. } => format!("SpecifiedType"),
        ASTElementKind::StringExpression { value, .. } => format!("{}", value),
        ASTElementKind::ThrowStatement { .. } => format!("ThrowStatement"),
        ASTElementKind::UnresolvedIdentifier { name, .. } => {
            format!("UnresolvedIdentifier {}", name)
        }
        ASTElementKind::WhileStatement { .. } => format!("WhileStatement"),
    }
}

fn sanitize(source: String) -> String {
    source
        .replace("\\", "\\\\")
        .replace("\"", "\\\"")
        .replace(">", "\\>")
        .replace("<", "\\<")
}
