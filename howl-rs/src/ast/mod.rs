use std::convert::TryFrom;

use crate::{ast::base_type_element::TypeElement, parser::CSTElement};

use self::{class_element::ClassElement, placeholder_element::PlaceholderElement};

pub mod base_type_element;
pub mod class_element;
pub mod placeholder_element;

pub trait Element: core::fmt::Debug + core::fmt::Display {
    fn span(&self) -> lrpar::Span;
}

pub struct ASTElement {}

impl ASTElement {
    pub fn from_cst(cst: CSTElement) -> Result<Box<dyn Element>, ()> {
        match cst {
            CSTElement::Class { .. } => Ok(Box::new(ClassElement::try_from(cst)?)),
            CSTElement::BaseType { .. } => Ok(Box::new(TypeElement::try_from(cst)?)),
            CSTElement::RawPointerType { .. } => Ok(Box::new(TypeElement::try_from(cst)?)),
            _ => Ok(Box::new(PlaceholderElement::from_cst(cst)?)),
        }
    }
}
