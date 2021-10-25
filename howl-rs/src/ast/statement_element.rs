use std::convert::{TryFrom, TryInto};

use crate::parser::CSTElement;

use super::{
    expression_element::ExpressionElement, type_element::TypeElement, CSTMismatchError, Element,
};

#[derive(Debug)]
pub enum StatementElement {
    AssignmentStatement {
        span: lrpar::Span,
        lhs: ExpressionElement,
        rhs: ExpressionElement,
    },
    CompoundStatement {
        span: lrpar::Span,
        statements: Vec<StatementElement>,
    },
    LocalDefinitionStatement {
        span: lrpar::Span,
        localtype: TypeElement,
        name: String,
        initializer: ExpressionElement,
    },
    PartialCatchStatement {
        span: lrpar::Span,
        exctype: TypeElement,
        excname: String,
        body: Box<StatementElement>,
    },
    PartialElseStatement {
        span: lrpar::Span,
        body: Box<StatementElement>,
    },
    PartialElseIfStatement {
        span: lrpar::Span,
        condition: ExpressionElement,
        body: Box<StatementElement>,
    },
    PartialIfStatement {
        span: lrpar::Span,
        condition: ExpressionElement,
        body: Box<StatementElement>,
    },
    PartialTryStatement {
        span: lrpar::Span,
        body: Box<StatementElement>,
    },
    ReturnStatement {
        span: lrpar::Span,
        expression: Option<ExpressionElement>,
    },
    SimpleStatement {
        span: lrpar::Span,
        expression: ExpressionElement,
    },
    ThrowStatement {
        span: lrpar::Span,
        expression: ExpressionElement,
    },
    WhileStatement {
        span: lrpar::Span,
        condition: ExpressionElement,
        body: Box<StatementElement>,
    },
}

impl TryFrom<CSTElement<'_>> for StatementElement {
    type Error = CSTMismatchError;

    fn try_from(cst: CSTElement) -> Result<StatementElement, CSTMismatchError> {
        match cst {
            CSTElement::AssignmentStatement { span, lhs, rhs } => {
                Ok(StatementElement::AssignmentStatement {
                    span,
                    lhs: lhs.to_owned().try_into()?,
                    rhs: rhs.to_owned().try_into()?,
                })
            }
            CSTElement::CatchStatement {
                span,
                exctype,
                excname,
                body,
            } => Ok(StatementElement::PartialCatchStatement {
                span,
                exctype: exctype.to_owned().try_into()?,
                excname: excname.to_string(),
                body: Box::new(body.to_owned().try_into()?),
            }),
            CSTElement::CompoundStatement { span, statements } => {
                Ok(StatementElement::CompoundStatement {
                    span,
                    statements: statements
                        .iter()
                        .map(|x| x.to_owned().try_into())
                        .collect::<Result<Vec<StatementElement>, CSTMismatchError>>()?,
                })
            }
            CSTElement::LocalDefinitionStatement {
                span,
                localtype,
                name,
                initializer,
            } => Ok(StatementElement::LocalDefinitionStatement {
                span,
                localtype: localtype.to_owned().try_into()?,
                name: name.to_string(),
                initializer: initializer.to_owned().try_into()?,
            }),
            CSTElement::ElseStatement { span, body } => {
                Ok(StatementElement::PartialElseStatement {
                    span,
                    body: Box::new(body.to_owned().try_into()?),
                })
            }
            CSTElement::ElseIfStatement {
                span,
                condition,
                body,
            } => Ok(StatementElement::PartialElseIfStatement {
                span,
                condition: condition.to_owned().try_into()?,
                body: Box::new(body.to_owned().try_into()?),
            }),
            CSTElement::IfStatement {
                span,
                condition,
                body,
            } => Ok(StatementElement::PartialIfStatement {
                span,
                condition: condition.to_owned().try_into()?,
                body: Box::new(body.to_owned().try_into()?),
            }),
            CSTElement::ReturnStatement { span, source } => Ok(StatementElement::ReturnStatement {
                span,
                expression: match source {
                    Some(statement) => Some(statement.to_owned().try_into()?),
                    None => None,
                },
            }),
            CSTElement::SimpleStatement { span, expression } => {
                Ok(StatementElement::SimpleStatement {
                    span,
                    expression: expression.to_owned().try_into()?,
                })
            }
            CSTElement::ThrowStatement { span, source } => Ok(StatementElement::ThrowStatement {
                span,
                expression: source.to_owned().try_into()?,
            }),
            CSTElement::TryStatement { span, body } => Ok(StatementElement::PartialTryStatement {
                span,
                body: Box::new(body.to_owned().try_into()?),
            }),
            CSTElement::WhileStatement {
                span,
                condition,
                body,
            } => Ok(StatementElement::WhileStatement {
                span,
                condition: condition.to_owned().try_into()?,
                body: Box::new(body.to_owned().try_into()?),
            }),
            _ => Err(CSTMismatchError::new("Statement", cst)),
        }
    }
}

impl Element for StatementElement {
    fn span(&self) -> lrpar::Span {
        match self {
            Self::AssignmentStatement { span, .. } => *span,
            Self::CompoundStatement { span, .. } => *span,
            Self::LocalDefinitionStatement { span, .. } => *span,
            Self::PartialCatchStatement { span, .. } => *span,
            Self::PartialElseStatement { span, .. } => *span,
            Self::PartialElseIfStatement { span, .. } => *span,
            Self::PartialIfStatement { span, .. } => *span,
            Self::PartialTryStatement { span, .. } => *span,
            Self::ReturnStatement { span, .. } => *span,
            Self::SimpleStatement { span, .. } => *span,
            Self::ThrowStatement { span, .. } => *span,
            Self::WhileStatement { span, .. } => *span,
        }
    }
}

impl std::fmt::Display for StatementElement {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            StatementElement::AssignmentStatement { span: _, lhs, rhs } => {
                write!(f, "{} = {};", lhs, rhs)
            }
            StatementElement::CompoundStatement {
                span: _,
                statements,
            } => write!(
                f,
                "{{\n{}\n}}",
                textwrap::indent(
                    &statements
                        .iter()
                        .map(|x| format!("{}", x))
                        .collect::<Vec<String>>()
                        .join("\n"),
                    "    "
                )
            ),
            StatementElement::PartialCatchStatement {
                span: _,
                exctype,
                excname,
                body,
            } => write!(f, "/* PARTIAL */ catch {} {} {}", exctype, excname, body),
            StatementElement::PartialElseStatement { span: _, body } => {
                write!(f, "/* PARTIAL */ else {}", body)
            }
            StatementElement::PartialElseIfStatement {
                span: _,
                condition,
                body,
            } => write!(f, "/* PARTIAL */ else if {} {}", condition, body),
            StatementElement::PartialIfStatement {
                span: _,
                condition,
                body,
            } => write!(f, "/* PARTIAL */ if {} {}", condition, body),
            StatementElement::PartialTryStatement { span: _, body } => {
                write!(f, "/* PARTIAL */ try {}", body)
            }
            StatementElement::LocalDefinitionStatement {
                span: _,
                localtype,
                name,
                initializer,
            } => write!(f, "let {} {} = {};", localtype, name, initializer),
            StatementElement::ReturnStatement {
                span: _,
                expression,
            } => match expression {
                Some(src) => write!(f, "return {};", src),
                None => write!(f, "return;"),
            },
            StatementElement::SimpleStatement {
                span: _,
                expression,
            } => write!(f, "{};", expression),
            StatementElement::ThrowStatement {
                span: _,
                expression,
            } => write!(f, "throw {};", expression),
            StatementElement::WhileStatement {
                span: _,
                condition,
                body,
            } => write!(f, "while {} {}", condition, body),
        }
    }
}
