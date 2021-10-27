use std::convert::{TryFrom, TryInto};

use crate::parser::CSTElement;

use super::{type_element::TypeElement, ASTElement, CSTMismatchError, Element};

#[derive(Debug, Clone)]
pub struct ClassFieldElement {
    span: lrpar::Span,
    fieldtype: TypeElement,
    fieldname: String,
}

impl ClassFieldElement {
    pub fn name(&self) -> String {
        self.fieldname.clone()
    }

    pub fn map_ast<F>(&self, mut callback: F) -> ASTElement
    where
        F: FnMut(ASTElement) -> ASTElement,
    {
        let new_type = match callback(ASTElement::Type(self.fieldtype.clone())) {
            ASTElement::Type(t) => t,
            x => panic!("can't replace a field type with {}", x),
        };
        ASTElement::ClassField(ClassFieldElement {
            span: self.span,
            fieldtype: new_type,
            fieldname: self.fieldname.clone(),
        })
    }
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
