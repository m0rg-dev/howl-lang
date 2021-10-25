use std::convert::{TryFrom, TryInto};

use crate::parser::CSTElement;

use super::{type_element::TypeElement, CSTMismatchError, Element};

#[derive(Debug)]
pub struct ClassFieldElement {
    span: lrpar::Span,
    fieldtype: TypeElement,
    fieldname: String,
}

impl TryFrom<CSTElement<'_>> for ClassFieldElement {
    type Error = CSTMismatchError;

    fn try_from(cst: CSTElement) -> Result<ClassFieldElement, CSTMismatchError> {
        match cst {
            CSTElement::ClassField {
                span,
                fieldtype,
                fieldname: CSTElement::Identifier { span: _, name },
            } => Ok(ClassFieldElement {
                span,
                fieldtype: fieldtype.to_owned().try_into()?,
                fieldname: name.to_string(),
            }),
            _ => Err(CSTMismatchError::new("ClassField", cst)),
        }
    }
}

impl Element for ClassFieldElement {
    fn span(&self) -> lrpar::Span {
        self.span
    }
}

impl std::fmt::Display for ClassFieldElement {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{} {};", self.fieldtype, self.fieldname)
    }
}
