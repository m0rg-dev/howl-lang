use std::convert::{TryFrom, TryInto};

use crate::parser::CSTElement;

use super::{ASTElement, CSTMismatchError, Element};

#[derive(Debug, Clone)]
pub enum TypeElement {
    BaseType {
        span: lrpar::Span,
        name: String,
    },
    RawPointerType {
        span: lrpar::Span,
        inner: Box<TypeElement>,
    },
    SpecifiedType {
        span: lrpar::Span,
        base: Box<TypeElement>,
        parameters: Vec<TypeElement>,
    },
}

impl TypeElement {
    pub fn map_ast<F>(&self, mut callback: F) -> ASTElement
    where
        F: FnMut(ASTElement) -> ASTElement,
    {
        match self {
            Self::BaseType { .. } => ASTElement::Type(self.clone()),
            Self::RawPointerType { span, inner } => {
                let new_inner = match callback(ASTElement::Type(*inner.to_owned())) {
                    ASTElement::Type(t) => t,
                    x => panic!("can't replace a RawPointer inner type with {}", x),
                };
                ASTElement::Type(TypeElement::RawPointerType {
                    span: *span,
                    inner: Box::new(new_inner),
                })
            }
            Self::SpecifiedType {
                span,
                base,
                parameters,
            } => {
                let new_parameters = parameters
                    .iter()
                    .map(|i| callback(ASTElement::Type(i.clone())))
                    .map(|i| match i {
                        ASTElement::Type(f) => f,
                        _ => panic!("can't replace a type parameter with {}", i),
                    })
                    .collect::<Vec<TypeElement>>();
                let new_base = match callback(ASTElement::Type(*base.to_owned())) {
                    ASTElement::Type(t) => t,
                    x => panic!("can't replace the base of a specified type with {}", x),
                };
                ASTElement::Type(TypeElement::SpecifiedType {
                    span: *span,
                    base: Box::new(new_base),
                    parameters: new_parameters,
                })
            }
        }
    }
}

impl TryFrom<CSTElement<'_>> for TypeElement {
    type Error = CSTMismatchError;

    fn try_from(cst: CSTElement) -> Result<TypeElement, CSTMismatchError> {
        match cst {
            CSTElement::BaseType { span, name } => Ok(TypeElement::BaseType { span, name }),
            CSTElement::RawPointerType { span, inner } => Ok(TypeElement::RawPointerType {
                span,
                inner: Box::new(inner.to_owned().try_into()?),
            }),
            CSTElement::SpecifiedType {
                span,
                base,
                parameters:
                    CSTElement::TypeParameterList {
                        span: _,
                        parameters,
                    },
            } => Ok(TypeElement::SpecifiedType {
                span,
                base: Box::new(base.to_owned().try_into()?),
                parameters: parameters
                    .iter()
                    .map(|x| x.to_owned().try_into())
                    .collect::<Result<Vec<TypeElement>, CSTMismatchError>>()?,
            }),
            _ => Err(CSTMismatchError::new("BaseType | RawPointerType", cst)),
        }
    }
}

impl Element for TypeElement {
    fn span(&self) -> lrpar::Span {
        match self {
            Self::BaseType { span, .. } => *span,
            Self::RawPointerType { span, .. } => *span,
            Self::SpecifiedType { span, .. } => *span,
        }
    }
}
impl std::fmt::Display for TypeElement {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            TypeElement::BaseType { span: _, name } => write!(f, "{}", name),
            TypeElement::RawPointerType { span: _, inner } => write!(f, "*{}", inner),
            TypeElement::SpecifiedType {
                span: _,
                base,
                parameters,
            } => write!(
                f,
                "{}<{}>",
                base,
                parameters
                    .iter()
                    .map(|x| format!("{}", x))
                    .collect::<Vec<String>>()
                    .join(", ")
            ),
        }
    }
}
