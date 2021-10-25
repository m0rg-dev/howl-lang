use std::convert::TryFrom;

use crate::parser::CSTElement;

use super::Element;

#[derive(Debug)]
pub enum TypeElement {
    BaseTypeElement { span: lrpar::Span, name: String },
}

impl TryFrom<CSTElement<'_>> for TypeElement {
    type Error = ();

    fn try_from(cst: CSTElement) -> Result<TypeElement, ()> {
        match cst {
            CSTElement::BaseType { span, name } => Ok(TypeElement::BaseTypeElement { span, name }),
            CSTElement::RawPointerType { .. } => unimplemented!(),
            _ => unreachable!(),
        }
    }
}

impl Element for TypeElement {
    fn span(&self) -> lrpar::Span {
        match self {
            Self::BaseTypeElement { span, .. } => *span,
        }
    }
}
impl std::fmt::Display for TypeElement {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            TypeElement::BaseTypeElement { span: _, name } => write!(f, "{}", name),
        }
    }
}
