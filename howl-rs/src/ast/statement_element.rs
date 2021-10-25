use std::convert::{TryFrom, TryInto};

use crate::{assert_expression, assert_statement, assert_type, parser::CSTElement};

use super::{
    expression_element::ExpressionElement, type_element::TypeElement, ASTElement, CSTMismatchError,
    Element,
};

#[derive(Debug, Clone)]
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

impl StatementElement {
    pub fn map_ast<F>(&self, callback: F) -> ASTElement
    where
        F: Fn(ASTElement) -> ASTElement,
    {
        match self {
            Self::AssignmentStatement { span, lhs, rhs } => {
                let new_lhs = assert_expression!(callback, lhs, "an AssignmentStatement lhs");
                let new_rhs = assert_expression!(callback, rhs, "an AssignmentStatement rhs");
                ASTElement::Statement(StatementElement::AssignmentStatement {
                    span: *span,
                    lhs: new_lhs,
                    rhs: new_rhs,
                })
            }
            Self::CompoundStatement { span, statements } => {
                let new_statements = statements
                    .iter()
                    .map(|i| assert_statement!(callback, i, "a CompoundStatement sub-statement"))
                    .collect::<Vec<StatementElement>>();
                ASTElement::Statement(StatementElement::CompoundStatement {
                    span: *span,
                    statements: new_statements,
                })
            }
            Self::LocalDefinitionStatement {
                span,
                localtype,
                name,
                initializer,
            } => {
                let new_localtype =
                    assert_type!(callback, localtype, "a LocalDefinitionStatement type");
                let new_initializer = assert_expression!(
                    callback,
                    initializer,
                    "a LocalDefinitionStatement initializer"
                );
                ASTElement::Statement(StatementElement::LocalDefinitionStatement {
                    span: *span,
                    localtype: new_localtype,
                    name: name.clone(),
                    initializer: new_initializer,
                })
            }
            Self::PartialCatchStatement {
                span,
                excname,
                exctype,
                body,
            } => {
                let new_exctype = assert_type!(callback, exctype, "a PartialCatchStatement type");
                let new_body = assert_statement!(callback, **body, "a PartialCatchStatement body");

                ASTElement::Statement(StatementElement::PartialCatchStatement {
                    span: *span,
                    excname: excname.clone(),
                    exctype: new_exctype,
                    body: Box::new(new_body),
                })
            }
            Self::PartialElseStatement { span, body } => {
                let new_body = assert_statement!(callback, **body, "a PartialElseStatement body");

                ASTElement::Statement(StatementElement::PartialElseStatement {
                    span: *span,
                    body: Box::new(new_body),
                })
            }
            Self::PartialIfStatement {
                span,
                condition,
                body,
            } => {
                let new_condition =
                    assert_expression!(callback, condition, "a PartialIfStatement condition");

                let new_body = assert_statement!(callback, **body, "a PartialIfStatement body");

                ASTElement::Statement(StatementElement::PartialIfStatement {
                    span: *span,
                    condition: new_condition,
                    body: Box::new(new_body),
                })
            }
            Self::PartialTryStatement { span, body } => {
                let new_body = assert_statement!(callback, **body, "a PartialTryStatement body");

                ASTElement::Statement(StatementElement::PartialTryStatement {
                    span: *span,
                    body: Box::new(new_body),
                })
            }
            Self::ReturnStatement { span, expression } => {
                let new_expression = expression.as_ref().map_or(None, |e| {
                    Some(assert_expression!(
                        callback,
                        e,
                        "a ReturnStatement expression"
                    ))
                });
                ASTElement::Statement(StatementElement::ReturnStatement {
                    span: *span,
                    expression: new_expression,
                })
            }
            Self::SimpleStatement { span, expression } => {
                let new_expression =
                    assert_expression!(callback, expression, "a SimpleStatement expression");
                ASTElement::Statement(StatementElement::SimpleStatement {
                    span: *span,
                    expression: new_expression,
                })
            }
            Self::ThrowStatement { span, expression } => {
                let new_expression =
                    assert_expression!(callback, expression, "a ThrowStatement expression");
                ASTElement::Statement(StatementElement::ThrowStatement {
                    span: *span,
                    expression: new_expression,
                })
            }
            Self::WhileStatement {
                span,
                condition,
                body,
            } => {
                let new_condition =
                    assert_expression!(callback, condition, "a WhileStatement condition");

                let new_body = assert_statement!(callback, **body, "a WhileStatement body");

                ASTElement::Statement(StatementElement::WhileStatement {
                    span: *span,
                    condition: new_condition,
                    body: Box::new(new_body),
                })
            }
            _ => panic!("not yet implemented: {}", self),
        }
    }
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
