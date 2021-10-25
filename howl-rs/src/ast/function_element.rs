use std::convert::{TryFrom, TryInto};

use crate::parser::CSTElement;

use super::{
    statement_element::StatementElement, type_element::TypeElement, ASTElement, CSTMismatchError,
    Element,
};

#[derive(Debug, Clone)]
pub struct FunctionElement {
    span: lrpar::Span,
    is_static: bool,
    returntype: TypeElement,
    name: String,
    args: Vec<TypedArgument>,
    throws: Vec<TypeElement>,
    body: StatementElement,
}

#[derive(Debug, Clone)]
struct TypedArgument {
    argtype: TypeElement,
    argname: String,
}

impl FunctionElement {
    pub fn map_ast<F>(&self, callback: F) -> ASTElement
    where
        F: Fn(ASTElement) -> ASTElement,
    {
        let new_returntype = match callback(ASTElement::Type(self.returntype.clone())) {
            ASTElement::Type(t) => t,
            x => panic!("can't replace a function return type with {}", x),
        };

        let new_args = self
            .args
            .iter()
            .map(|i| {
                (
                    callback(ASTElement::Type(i.argtype.clone())),
                    i.argname.clone(),
                )
            })
            .map(|i| match i.0 {
                ASTElement::Type(t) => TypedArgument {
                    argtype: t,
                    argname: i.1,
                },
                x => panic!("can't replace a function argument with {}", x),
            })
            .collect::<Vec<TypedArgument>>();

        let new_throws = self
            .throws
            .iter()
            .map(|i| callback(ASTElement::Type(i.clone())))
            .map(|i| match i {
                ASTElement::Type(t) => t,
                _ => panic!("can't replace a throws type with {}", i),
            })
            .collect::<Vec<TypeElement>>();

        let new_body = match callback(ASTElement::Statement(self.body.clone())) {
            ASTElement::Statement(t) => t,
            x => panic!("can't replace a function body with {}", x),
        };

        return ASTElement::Function(FunctionElement {
            span: self.span,
            is_static: self.is_static,
            returntype: new_returntype,
            name: self.name.clone(),
            args: new_args,
            throws: new_throws,
            body: new_body,
        });
    }
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
