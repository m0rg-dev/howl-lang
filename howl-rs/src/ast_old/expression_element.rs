use std::convert::{TryFrom, TryInto};

use crate::{assert_expression, assert_type, parser::CSTElement};

use super::{type_element::TypeElement, ASTElement, CSTMismatchError, Element};

#[derive(Debug, Clone)]
pub enum ExpressionElement {
    Arithmetic {
        span: lrpar::Span,
        operator: String,
        lhs: Box<ExpressionElement>,
        rhs: Box<ExpressionElement>,
    },
    ConstructorCall {
        span: lrpar::Span,
        source: TypeElement,
        args: Vec<ExpressionElement>,
    },
    FieldReference {
        span: lrpar::Span,
        source: Box<ExpressionElement>,
        name: String,
    },
    FFICall {
        span: lrpar::Span,
        name: String,
        args: Vec<ExpressionElement>,
    },
    FunctionCall {
        span: lrpar::Span,
        source: Box<ExpressionElement>,
        args: Vec<ExpressionElement>,
    },
    Index {
        span: lrpar::Span,
        source: Box<ExpressionElement>,
        index: Box<ExpressionElement>,
    },
    MacroCall {
        span: lrpar::Span,
        name: String,
        args: Vec<ExpressionElement>,
    },
    Name {
        span: lrpar::Span,
        name: String,
    },
    Number {
        span: lrpar::Span,
        as_text: String,
    },
    String {
        span: lrpar::Span,
        contents: String,
    },
}

impl ExpressionElement {
    #[allow(dead_code)]
    pub fn new_string(span: Option<lrpar::Span>, contents: String) -> ExpressionElement {
        ExpressionElement::String {
            span: span.or(Some(lrpar::Span::new(0, 0))).unwrap(),
            contents,
        }
    }

    pub fn map_ast<F>(&self, mut callback: F) -> ASTElement
    where
        F: FnMut(ASTElement) -> ASTElement,
    {
        match self {
            Self::Arithmetic {
                span,
                operator,
                lhs,
                rhs,
            } => {
                let new_lhs = assert_expression!(callback, **lhs, "an Arithmetic lhs");
                let new_rhs = assert_expression!(callback, **rhs, "an Arithmetic rhs");
                ASTElement::Expression(ExpressionElement::Arithmetic {
                    span: *span,
                    operator: operator.clone(),
                    lhs: Box::new(new_lhs),
                    rhs: Box::new(new_rhs),
                })
            }
            Self::ConstructorCall { span, source, args } => {
                let new_args = args
                    .iter()
                    .map(|x| assert_expression!(callback, x, "a ConstructorCall argument"))
                    .collect();
                let new_source = assert_type!(callback, source, "a ConstructorCall source");
                ASTElement::Expression(ExpressionElement::ConstructorCall {
                    span: *span,
                    source: new_source,
                    args: new_args,
                })
            }
            Self::FFICall { span, name, args } => {
                let new_args = args
                    .iter()
                    .map(|x| assert_expression!(callback, x, "a FFICall argument"))
                    .collect();
                ASTElement::Expression(ExpressionElement::FFICall {
                    span: *span,
                    name: name.clone(),
                    args: new_args,
                })
            }
            Self::FunctionCall { span, source, args } => {
                let new_source = assert_expression!(callback, **source, "a FunctionCall source");
                let new_args = args
                    .iter()
                    .map(|x| assert_expression!(callback, x, "a FunctionCall argument"))
                    .collect();
                ASTElement::Expression(ExpressionElement::FunctionCall {
                    span: *span,
                    source: Box::new(new_source),
                    args: new_args,
                })
            }
            Self::FieldReference { span, source, name } => {
                let new_source = assert_expression!(callback, **source, "a FieldReference source");
                ASTElement::Expression(ExpressionElement::FieldReference {
                    span: *span,
                    source: Box::new(new_source),
                    name: name.clone(),
                })
            }
            Self::Index {
                span,
                source,
                index,
            } => {
                let new_source = assert_expression!(callback, **source, "an Index source");
                let new_index = assert_expression!(callback, **index, "an Index argument");
                ASTElement::Expression(ExpressionElement::Index {
                    span: *span,
                    source: Box::new(new_source),
                    index: Box::new(new_index),
                })
            }
            Self::MacroCall { span, name, args } => {
                let new_args = args
                    .iter()
                    .map(|x| assert_expression!(callback, x, "a MacroCall argument"))
                    .collect();
                ASTElement::Expression(ExpressionElement::MacroCall {
                    span: *span,
                    name: name.clone(),
                    args: new_args,
                })
            }
            Self::Name { .. } => ASTElement::Expression(self.clone()),
            Self::Number { .. } => ASTElement::Expression(self.clone()),
            Self::String { .. } => ASTElement::Expression(self.clone()),
        }
    }
}

impl TryFrom<CSTElement<'_>> for ExpressionElement {
    type Error = CSTMismatchError;

    fn try_from(cst: CSTElement) -> Result<ExpressionElement, CSTMismatchError> {
        match cst {
            CSTElement::ArithmeticExpression {
                span,
                operator,
                lhs,
                rhs,
            } => Ok(ExpressionElement::Arithmetic {
                span,
                operator: operator.to_string(),
                lhs: Box::new(lhs.to_owned().try_into()?),
                rhs: Box::new(rhs.to_owned().try_into()?),
            }),
            CSTElement::ConstructorCallExpression {
                span,
                source,
                args: CSTElement::ArgumentList { span: _, args },
            } => Ok(ExpressionElement::ConstructorCall {
                span,
                source: source.to_owned().try_into()?,
                args: args
                    .iter()
                    .map(|x| x.to_owned().try_into())
                    .collect::<Result<Vec<ExpressionElement>, CSTMismatchError>>()?,
            }),
            CSTElement::FieldReferenceExpression { span, source, name } => {
                Ok(ExpressionElement::FieldReference {
                    span,
                    source: Box::new(source.to_owned().try_into()?),
                    name: name.to_string(),
                })
            }
            CSTElement::FFICallExpression {
                span,
                name,
                args: CSTElement::ArgumentList { span: _, args },
            } => Ok(ExpressionElement::FFICall {
                span,
                name: name.to_string(),
                args: args
                    .iter()
                    .map(|x| x.to_owned().try_into())
                    .collect::<Result<Vec<ExpressionElement>, CSTMismatchError>>()?,
            }),
            CSTElement::FunctionCallExpression {
                span,
                source,
                args: CSTElement::ArgumentList { span: _, args },
            } => Ok(ExpressionElement::FunctionCall {
                span,
                source: Box::new(source.to_owned().try_into()?),
                args: args
                    .iter()
                    .map(|x| x.to_owned().try_into())
                    .collect::<Result<Vec<ExpressionElement>, CSTMismatchError>>()?,
            }),
            CSTElement::IndexExpression {
                span,
                source,
                index,
            } => Ok(ExpressionElement::Index {
                span,
                source: Box::new(source.to_owned().try_into()?),
                index: Box::new(index.to_owned().try_into()?),
            }),
            CSTElement::MacroCallExpression {
                span,
                name,
                args: CSTElement::ArgumentList { span: _, args },
            } => Ok(ExpressionElement::MacroCall {
                span,
                name: name.to_string(),
                args: args
                    .iter()
                    .map(|x| x.to_owned().try_into())
                    .collect::<Result<Vec<ExpressionElement>, CSTMismatchError>>()?,
            }),
            CSTElement::NameExpression { span, name } => Ok(ExpressionElement::Name {
                span,
                name: name.to_string(),
            }),
            CSTElement::NumberExpression { span, as_text } => Ok(ExpressionElement::Number {
                span,
                as_text: as_text.to_string(),
            }),
            CSTElement::StringLiteral { span, contents } => Ok(ExpressionElement::String {
                span,
                contents: contents.to_string(),
            }),
            _ => Err(CSTMismatchError::new("Expression", cst)),
        }
    }
}

impl Element for ExpressionElement {
    fn span(&self) -> lrpar::Span {
        match self {
            Self::Arithmetic { span, .. } => *span,
            Self::ConstructorCall { span, .. } => *span,
            Self::FieldReference { span, .. } => *span,
            Self::FFICall { span, .. } => *span,
            Self::FunctionCall { span, .. } => *span,
            Self::Index { span, .. } => *span,
            Self::MacroCall { span, .. } => *span,
            Self::Name { span, .. } => *span,
            Self::Number { span, .. } => *span,
            Self::String { span, .. } => *span,
        }
    }
}

impl std::fmt::Display for ExpressionElement {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            Self::Arithmetic {
                span: _,
                operator,
                lhs,
                rhs,
            } => write!(f, "({} {} {})", lhs, operator, rhs),
            Self::ConstructorCall {
                span: _,
                source,
                args,
            } => write!(
                f,
                "new {}({})",
                source,
                args.iter()
                    .map(|x| format!("{}", x))
                    .collect::<Vec<String>>()
                    .join(", ")
            ),
            Self::FieldReference {
                span: _,
                source,
                name,
            } => write!(f, "{}.{}", source, name),
            Self::FFICall {
                span: _,
                name,
                args,
            } => write!(
                f,
                "fficall {}({})",
                name,
                args.iter()
                    .map(|x| format!("{}", x))
                    .collect::<Vec<String>>()
                    .join(", ")
            ),
            Self::FunctionCall {
                span: _,
                source,
                args,
            } => write!(
                f,
                "{}({})",
                source,
                args.iter()
                    .map(|x| format!("{}", x))
                    .collect::<Vec<String>>()
                    .join(", ")
            ),
            Self::Index {
                span: _,
                source,
                index,
            } => write!(f, "{}[{}]", source, index),
            Self::MacroCall {
                span: _,
                name,
                args,
            } => write!(
                f,
                "!{}({})",
                name,
                args.iter()
                    .map(|x| format!("{}", x))
                    .collect::<Vec<String>>()
                    .join(", ")
            ),
            Self::Name { span: _, name } => write!(f, "{}", name),
            Self::Number { span: _, as_text } => write!(f, "{}", as_text),
            Self::String { span: _, contents } => write!(f, "{}", contents),
        }
    }
}
