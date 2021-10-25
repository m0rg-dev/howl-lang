use std::convert::From;
use std::convert::TryFrom;

use crate::parser::CSTElement;

use self::{
    class_element::ClassElement, class_field_element::ClassFieldElement,
    expression_element::ExpressionElement,
    function_declaration_element::FunctionDeclarationElement, function_element::FunctionElement,
    interface_element::InterfaceElement, placeholder_element::PlaceholderElement,
    statement_element::StatementElement, type_element::TypeElement,
};

pub mod class_element;
pub mod class_field_element;
pub mod expression_element;
pub mod function_declaration_element;
pub mod function_element;
pub mod interface_element;
pub mod placeholder_element;
pub mod statement_element;
pub mod type_element;

pub trait Element: core::fmt::Debug + core::fmt::Display {
    fn span(&self) -> lrpar::Span;
}

#[derive(Debug, Clone)]
pub struct CSTMismatchError {
    expected: String,
    found: String,
}

impl CSTMismatchError {
    pub fn new(expected: &str, found: CSTElement) -> CSTMismatchError {
        CSTMismatchError {
            expected: expected.to_string(),
            found: format!("{:#?}", found),
        }
    }
}

#[derive(Debug, Clone)]
pub enum ASTElement {
    Class(ClassElement),
    ClassField(ClassFieldElement),
    Expression(ExpressionElement),
    FunctionDeclaration(FunctionDeclarationElement),
    Function(FunctionElement),
    Interface(InterfaceElement),
    Placeholder(PlaceholderElement),
    Statement(StatementElement),
    Type(TypeElement),
}

impl TryFrom<CSTElement<'_>> for ASTElement {
    type Error = CSTMismatchError;
    fn try_from(cst: CSTElement) -> Result<ASTElement, CSTMismatchError> {
        match cst {
            CSTElement::Class { .. } => Ok(ClassElement::try_from(cst)?.into()),
            CSTElement::Function { .. } => Ok(FunctionElement::try_from(cst)?.into()),
            CSTElement::Interface { .. } => Ok(InterfaceElement::try_from(cst)?.into()),
            _ => Ok(PlaceholderElement::from_cst(cst)?.into()),
        }
    }
}

impl std::fmt::Display for ASTElement {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Class(el) => write!(f, "{}", el),
            Self::ClassField(el) => write!(f, "{}", el),
            Self::Expression(el) => write!(f, "{}", el),
            Self::FunctionDeclaration(el) => write!(f, "{}", el),
            Self::Function(el) => write!(f, "{}", el),
            Self::Interface(el) => write!(f, "{}", el),
            Self::Placeholder(el) => write!(f, "{}", el),
            Self::Statement(el) => write!(f, "{}", el),
            Self::Type(el) => write!(f, "{}", el),
        }
    }
}

macro_rules! ast_from {
    ($from: ty, $to: expr) => {
        impl From<$from> for ASTElement {
            fn from(source: $from) -> ASTElement {
                $to(source)
            }
        }
    };
}

ast_from!(ClassElement, ASTElement::Class);
ast_from!(ClassFieldElement, ASTElement::ClassField);
ast_from!(ExpressionElement, ASTElement::Expression);
ast_from!(FunctionDeclarationElement, ASTElement::FunctionDeclaration);
ast_from!(FunctionElement, ASTElement::Function);
ast_from!(InterfaceElement, ASTElement::Interface);
ast_from!(PlaceholderElement, ASTElement::Placeholder);
ast_from!(StatementElement, ASTElement::Statement);
ast_from!(TypeElement, ASTElement::Type);

#[macro_export]
macro_rules! assert_expression {
    ($callback: expr, $source: expr, $diag: expr) => {
        match $callback(ASTElement::Expression($source.clone())) {
            ASTElement::Expression(e) => e,
            x => panic!("can't replace {} with {}", $diag, x),
        }
    };
}

#[macro_export]
macro_rules! assert_statement {
    ($callback: expr, $source: expr, $diag: expr) => {
        match $callback(ASTElement::Statement($source.clone())) {
            ASTElement::Statement(s) => s,
            x => panic!("can't replace {} with {}", $diag, x),
        }
    };
}

#[macro_export]
macro_rules! assert_type {
    ($callback: expr, $source: expr, $diag: expr) => {
        match $callback(ASTElement::Type($source.clone())) {
            ASTElement::Type(s) => s,
            x => panic!("can't replace {} with {}", $diag, x),
        }
    };
}
