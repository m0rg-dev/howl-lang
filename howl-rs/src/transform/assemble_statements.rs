use std::iter;

use crate::{
    ast::{
        expression_element::ExpressionElement, statement_element::StatementElement,
        type_element::TypeElement, ASTElement,
    },
    compilation_unit::{CompilationError, CompilationUnit},
};

use super::map_ast;

pub fn assemble_statements(source: ASTElement, cu: &CompilationUnit) -> ASTElement {
    match source {
        ASTElement::Statement(StatementElement::CompoundStatement { span, statements }) => {
            let mut new_statements: Vec<StatementElement> = vec![];
            let mut it = statements.iter();
            while it.len() > 0 {
                let stmt = it.next().unwrap();
                match stmt {
                    StatementElement::PartialCatchStatement {
                        span,
                        exctype,
                        excname,
                        body,
                    } => {
                        let catch_body = body;
                        match new_statements.pop() {
                            Some(StatementElement::TryStatement {
                                span,
                                body,
                                clauses,
                            }) => {
                                new_statements.push(StatementElement::TryStatement {
                                    span,
                                    body,
                                    clauses: clauses
                                        .into_iter()
                                        .chain(iter::once((
                                            exctype.clone(),
                                            excname.clone(),
                                            *catch_body.clone(),
                                        )))
                                        .collect::<Vec<(TypeElement, String, StatementElement)>>(),
                                });
                            }
                            Some(x) => {
                                new_statements.push(x);
                                cu.add_error(CompilationError::ValidationError {
                                    span: *span,
                                    description: "catch statement without corresponding try"
                                        .to_string(),
                                })
                            }
                            None => unreachable!(),
                        }
                    }
                    StatementElement::PartialIfStatement {
                        span,
                        condition,
                        body,
                    } => new_statements.push(StatementElement::IfStatement {
                        span: *span,
                        clauses: vec![(condition.clone(), *body.clone())],
                        default: None,
                    }),
                    StatementElement::PartialElseIfStatement {
                        span,
                        condition,
                        body,
                    } => match new_statements.pop() {
                        Some(StatementElement::IfStatement {
                            span,
                            clauses,
                            default,
                        }) => {
                            new_statements.push(StatementElement::IfStatement {
                                span,
                                clauses: clauses
                                    .into_iter()
                                    .chain(iter::once((condition.clone(), *body.clone())))
                                    .collect::<Vec<(ExpressionElement, StatementElement)>>(),
                                default,
                            });
                        }
                        Some(x) => {
                            new_statements.push(x);
                            cu.add_error(CompilationError::ValidationError {
                                span: *span,
                                description: "else if statement without corresponding if"
                                    .to_string(),
                            })
                        }
                        None => unreachable!(),
                    },
                    StatementElement::PartialElseStatement { span, body } => {
                        match new_statements.pop() {
                            Some(StatementElement::IfStatement {
                                span,
                                clauses,
                                default: None,
                            }) => {
                                new_statements.push(StatementElement::IfStatement {
                                    span,
                                    clauses,
                                    default: Some(body.clone()),
                                });
                            }
                            Some(x) => {
                                new_statements.push(x);
                                cu.add_error(CompilationError::ValidationError {
                                    span: *span,
                                    description: "else statement without corresponding if"
                                        .to_string(),
                                })
                            }
                            None => unreachable!(),
                        }
                    }
                    StatementElement::PartialTryStatement { span, body } => {
                        new_statements.push(StatementElement::TryStatement {
                            span: *span,
                            body: Box::new(*body.clone()),
                            clauses: vec![],
                        })
                    }
                    _ => new_statements.push(stmt.to_owned()),
                }
            }

            ASTElement::Statement(StatementElement::CompoundStatement {
                span,
                statements: new_statements,
            })
        }
        _ => map_ast(source, |e| assemble_statements(e, cu)),
    }
}
