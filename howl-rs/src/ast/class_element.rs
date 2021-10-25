use std::{
    convert::{TryFrom, TryInto},
    fmt::Formatter,
};

use crate::{ast::type_element::TypeElement, parser::CSTElement};

use super::{
    class_field_element::ClassFieldElement, function_element::FunctionElement, CSTMismatchError,
    Element,
};

#[derive(Debug)]
pub struct ClassElement {
    span: lrpar::Span,
    name: String,
    extends: Option<String>,
    generics: Vec<String>,
    implements: Vec<TypeElement>,
    fields: Vec<ClassFieldElement>,
    methods: Vec<FunctionElement>,
}

impl TryFrom<CSTElement<'_>> for ClassElement {
    type Error = CSTMismatchError;

    fn try_from(cst: CSTElement) -> Result<ClassElement, CSTMismatchError> {
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
                body: CSTElement::ClassBody { span: _, elements },
            } => Ok(ClassElement {
                span,
                name: name.to_string(),
                extends: ClassElement::convert_extends(extends),
                generics: ClassElement::convert_generics(generics),
                implements: implements
                    .iter()
                    .map(|x| x.to_owned().try_into())
                    .collect::<Result<Vec<TypeElement>, CSTMismatchError>>()?,
                fields: elements
                    .iter()
                    .filter_map(|x| x.to_owned().try_into().ok())
                    .collect(),
                methods: elements
                    .iter()
                    .filter(|x| match x {
                        CSTElement::Function { .. } => true,
                        _ => false,
                    })
                    .map(|x| x.to_owned().try_into())
                    .collect::<Result<Vec<FunctionElement>, CSTMismatchError>>()?,
            }),
            _ => Err(CSTMismatchError::new("Class", cst)),
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

        self.fields
            .iter()
            .map(|x| write!(f, "    {}\n", x))
            .collect::<Result<Vec<()>, std::fmt::Error>>()?;

        self.methods
            .iter()
            .map(|x| write!(f, "{}", textwrap::indent(&format!("{}\n", x), "    ")))
            .collect::<Result<Vec<()>, std::fmt::Error>>()?;

        write!(f, "}}")
    }
}
