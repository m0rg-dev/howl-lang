use std::{convert::TryFrom, fmt::Formatter};

use crate::{ast::base_type_element::TypeElement, parser::CSTElement};

use super::Element;

#[derive(Debug)]
pub struct ClassElement {
    span: lrpar::Span,
    name: String,
    extends: Option<String>,
    generics: Vec<String>,
    implements: Vec<TypeElement>,
}

impl TryFrom<CSTElement<'_>> for ClassElement {
    type Error = ();

    fn try_from(cst: CSTElement) -> Result<ClassElement, ()> {
        match cst {
            CSTElement::Class {
                span,
                header:
                    CSTElement::ClassHeader {
                        span: _,
                        name: CSTElement::Identifier { span: _, name },
                        generics,
                        extends,
                        implements,
                    },
                body: _,
            } => Ok(ClassElement {
                span,
                name: name.to_string(),
                extends: ClassElement::convert_extends(extends),
                generics: ClassElement::convert_generics(generics),
                implements: implements
                    .iter()
                    .map(|x| TypeElement::try_from(x.to_owned()))
                    .collect::<Result<Vec<TypeElement>, ()>>()?,
            }),
            _ => unreachable!(),
        }
    }
}

impl ClassElement {
    fn convert_extends(extends: &Option<&CSTElement>) -> Option<String> {
        match extends {
            Some(CSTElement::Identifier { span: _, name }) => Some(name.to_string()),
            Some(_) => unreachable!(),
            None => None,
        }
    }

    fn convert_generics(generics: &Option<&CSTElement>) -> Vec<String> {
        match generics {
            Some(CSTElement::GenericList { span: _, names }) => names
                .iter()
                .map(|n| match n {
                    CSTElement::Identifier { span: _, name } => name.to_string(),
                    _ => unreachable!(),
                })
                .collect(),
            Some(_) => unreachable!(),
            None => vec![],
        }
    }
}

impl Element for ClassElement {
    fn span(&self) -> lrpar::Span {
        self.span
    }
}
impl std::fmt::Display for ClassElement {
    fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
        write!(f, "class {}", self.name)?;

        if self.generics.len() > 0 {
            write!(f, "<{}>", self.generics.join(", "))?;
        }

        match &self.extends {
            Some(parent) => {
                write!(f, " extends {}", parent)?;
            }
            None => {}
        }

        if self.implements.len() > 0 {
            write!(
                f,
                " implements {}",
                self.implements
                    .iter()
                    .map(|x| x.to_string())
                    .collect::<Vec<String>>()
                    .join(", ")
            )?;
        }

        write!(f, " {{\n")?;
        write!(f, "}}")
    }
}
