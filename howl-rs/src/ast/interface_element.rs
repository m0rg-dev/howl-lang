use std::{
    convert::{TryFrom, TryInto},
    fmt::Formatter,
};

use crate::parser::CSTElement;

use super::{
    function_declaration_element::FunctionDeclarationElement, ASTElement, CSTMismatchError, Element,
};

#[derive(Debug, Clone)]
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

    pub fn map_ast<F>(&self, mut callback: F) -> ASTElement
    where
        F: FnMut(ASTElement) -> ASTElement,
    {
        let new_methods = self
            .methods
            .iter()
            .map(|i| callback(ASTElement::FunctionDeclaration(i.clone())))
            .map(|i| match i {
                ASTElement::FunctionDeclaration(f) => f,
                _ => panic!("can't replace an interface method with {}", i),
            })
            .collect::<Vec<FunctionDeclarationElement>>();

        ASTElement::Interface(InterfaceElement {
            span: self.span,
            name: self.name.clone(),
            generics: self.generics.clone(),
            methods: new_methods,
        })
    }

    pub fn name(&self) -> &String {
        &self.name
    }

    pub fn with_name(self, new_name: String) -> InterfaceElement {
        InterfaceElement {
            span: self.span,
            name: new_name,
            generics: self.generics,
            methods: self.methods,
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
