use std::convert::{TryFrom, TryInto};

use crate::parser::CSTElement;

use super::{
    statement_element::StatementElement, type_element::TypeElement, CSTMismatchError, Element,
};

#[derive(Debug)]
pub struct FunctionElement {
    span: lrpar::Span,
    is_static: bool,
    returntype: TypeElement,
    name: String,
    args: Vec<TypedArgument>,
    throws: Vec<TypeElement>,
    body: StatementElement,
}

#[derive(Debug)]
struct TypedArgument {
    argtype: TypeElement,
    argname: String,
}

fn convert_argument(cst: CSTElement) -> Result<TypedArgument, CSTMismatchError> {
    match cst {
        CSTElement::TypedArgument {
            span: _,
            argtype,
            argname: CSTElement::Identifier { span: _, name },
        } => Ok(TypedArgument {
            argtype: argtype.to_owned().try_into()?,
            argname: name.to_string(),
        }),
        _ => Err(CSTMismatchError::new("TypedArgument", cst)),
    }
}

impl TryFrom<CSTElement<'_>> for FunctionElement {
    type Error = CSTMismatchError;

    fn try_from(cst: CSTElement) -> Result<FunctionElement, CSTMismatchError> {
        match cst {
            CSTElement::Function {
                span,
                header:
                    CSTElement::FunctionDeclaration {
                        span: _,
                        is_static,
                        returntype,
                        name: CSTElement::Identifier { span: _, name },
                        args: CSTElement::TypedArgumentList { span: _, args },
                        throws,
                    },
                body,
            } => Ok(FunctionElement {
                span,
                is_static: *is_static,
                returntype: (*returntype).to_owned().try_into()?,
                name: name.to_string(),
                args: args
                    .iter()
                    .map(|x| convert_argument(x.to_owned()))
                    .collect::<Result<Vec<TypedArgument>, CSTMismatchError>>()?,
                throws: throws
                    .iter()
                    .map(|x| x.to_owned().try_into())
                    .collect::<Result<Vec<TypeElement>, CSTMismatchError>>()?,
                body: body.to_owned().try_into()?,
            }),
            _ => Err(CSTMismatchError::new("Function", cst)),
        }
    }
}

impl Element for FunctionElement {
    fn span(&self) -> lrpar::Span {
        self.span
    }
}

impl std::fmt::Display for FunctionElement {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        if self.is_static {
            write!(f, "static ")?;
        }
        write!(f, "fn {} {} (", self.returntype, self.name)?;
        write!(
            f,
            "{}",
            self.args
                .iter()
                .map(|x| format!("{} {}", x.argtype, x.argname))
                .collect::<Vec<String>>()
                .join(", ")
        )?;
        write!(f, ") ")?;

        if self.throws.len() > 0 {
            write!(
                f,
                "throws {} ",
                self.throws
                    .iter()
                    .map(|x| format!("{}", x))
                    .collect::<Vec<String>>()
                    .join(", ")
            )?;
        }

        write!(f, "{}", self.body)
    }
}
