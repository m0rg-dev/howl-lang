use std::{
    convert::{TryFrom, TryInto},
    fmt::Formatter,
};

use crate::parser::CSTElement;

use super::{function_declaration_element::FunctionDeclarationElement, CSTMismatchError, Element};

#[derive(Debug)]
pub struct InterfaceElement {
    span: lrpar::Span,
    name: String,
    generics: Vec<String>,
    methods: Vec<FunctionDeclarationElement>,
}

impl TryFrom<CSTElement<'_>> for InterfaceElement {
    type Error = CSTMismatchError;

    fn try_from(cst: CSTElement) -> Result<InterfaceElement, CSTMismatchError> {
        match cst {
            CSTElement::Interface {
                span,
                header:
                    CSTElement::InterfaceHeader {
                        span: _,
                        name: CSTElement::Identifier { span: _, name },
                        generics,
                    },
                body: CSTElement::InterfaceBody { span: _, elements },
            } => Ok(InterfaceElement {
                span,
                name: name.to_string(),
                generics: InterfaceElement::convert_generics(generics),
                methods: elements
                    .iter()
                    .filter(|x| match x {
                        CSTElement::FunctionDeclaration { .. } => true,
                        _ => false,
                    })
                    .map(|x| x.to_owned().try_into())
                    .collect::<Result<Vec<FunctionDeclarationElement>, CSTMismatchError>>()?,
            }),
            _ => Err(CSTMismatchError::new("Class", cst)),
        }
    }
}

impl InterfaceElement {
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

impl Element for InterfaceElement {
    fn span(&self) -> lrpar::Span {
        self.span
    }
}
impl std::fmt::Display for InterfaceElement {
    fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
        write!(f, "interface {}", self.name)?;

        if self.generics.len() > 0 {
            write!(f, "<{}>", self.generics.join(", "))?;
        }

        write!(f, " {{\n")?;

        self.methods
            .iter()
            .map(|x| write!(f, "{}", textwrap::indent(&format!("{}\n", x), "    ")))
            .collect::<Result<Vec<()>, std::fmt::Error>>()?;

        write!(f, "}}")
    }
}