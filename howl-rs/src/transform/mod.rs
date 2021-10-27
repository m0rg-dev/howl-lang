use crate::ast::{placeholder_element::PlaceholderElement, ASTElement};

pub mod assemble_statements;
pub use assemble_statements::assemble_statements;

pub mod qualify_items;
pub use qualify_items::qualify_items;

pub mod resolve_names;

pub fn map_ast<F>(source: ASTElement, callback: F) -> ASTElement
where
    F: FnMut(ASTElement) -> ASTElement,
{
    match source {
        ASTElement::Class(el) => el.map_ast(callback),
        ASTElement::ClassField(el) => el.map_ast(callback),
        ASTElement::Expression(el) => el.map_ast(callback),
        ASTElement::Function(el) => el.map_ast(callback),
        ASTElement::FunctionDeclaration(el) => el.map_ast(callback),
        ASTElement::Interface(el) => el.map_ast(callback),
        ASTElement::Statement(el) => el.map_ast(callback),
        ASTElement::Type(el) => el.map_ast(callback),
        _ => ASTElement::Placeholder(PlaceholderElement::new()),
    }
}
