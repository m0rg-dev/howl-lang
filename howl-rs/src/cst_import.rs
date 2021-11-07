use crate::{
    ast::{
        ASTElement, ASTElementKind, ASSIGNMENT_STATEMENT_LHS, ASSIGNMENT_STATEMENT_RHS,
        CLASS_EXTENDS, CLASS_FIELD_TYPE, FUNCTION_BODY, FUNCTION_RETURN,
        LOCAL_DEFINITION_STATEMENT_INITIALIZER, LOCAL_DEFINITION_STATEMENT_TYPE,
        RAW_POINTER_TYPE_INNER, RETURN_STATEMENT_EXPRESSION, SIMPLE_STATEMENT_EXPRESSION,
        SPECIFIED_TYPE_BASE,
    },
    context::CompilationContext,
    log,
    logger::{LogLevel, Logger},
    parser::CSTElement,
};

impl CompilationContext {
    pub fn parse_cst(&self, cst: CSTElement, prefix: &str) -> ASTElement {
        match cst {
            CSTElement::AssignmentStatement { span, lhs, rhs } => {
                let statement = ASTElement::new(ASTElementKind::AssignmentStatement { span });
                statement.slot_insert(
                    ASSIGNMENT_STATEMENT_LHS,
                    self.parse_cst(lhs.to_owned(), prefix),
                );
                statement.slot_insert(
                    ASSIGNMENT_STATEMENT_RHS,
                    self.parse_cst(rhs.to_owned(), prefix),
                );
                statement
            }
            CSTElement::BaseType { span, name } => {
                ASTElement::new(ASTElementKind::UnresolvedIdentifier {
                    span,
                    name,
                    namespace: "type".to_owned(),
                })
            }

            CSTElement::Class {
                span,
                header:
                    CSTElement::ClassHeader {
                        span: _,
                        name: CSTElement::Identifier { span: _, name },
                        generics,
                        extends,
                        implements: _,
                    },
                body: CSTElement::ClassBody { span: _, elements },
            } => {
                let class_path = prefix.to_owned() + "." + name;
                let class = self.path_set(
                    &class_path,
                    ASTElement::new(ASTElementKind::Class {
                        span,
                        name: name.clone(),
                    }),
                );

                for element in elements {
                    self.parse_cst(element.clone(), &class_path);
                }

                if generics.is_some() {
                    if let Some(CSTElement::GenericList { span: _, names }) = generics {
                        for element in names {
                            if let CSTElement::Identifier { span: _, name } = element {
                                self.path_set(
                                    &(class_path.clone() + "." + name),
                                    ASTElement::new(ASTElementKind::NewType { name: name.clone() }),
                                );
                            } else {
                                unreachable!()
                            }
                        }
                    } else {
                        unreachable!()
                    }
                }

                if extends.is_some() {
                    let extends = self
                        .parse_cst(extends.unwrap().clone(), &class_path)
                        .clone();
                    class.slot_insert(CLASS_EXTENDS, extends);
                }

                class
            }

            CSTElement::ClassField {
                span,
                fieldname: CSTElement::Identifier { span: _, name },
                fieldtype,
            } => {
                let ftype = self.parse_cst(fieldtype.clone(), prefix).clone();
                let handle = self.path_set(
                    &(prefix.to_owned() + "." + name),
                    ASTElement::new(ASTElementKind::ClassField {
                        span,
                        name: name.to_owned(),
                    }),
                );
                handle.slot_insert(CLASS_FIELD_TYPE, ftype);
                handle
            }

            CSTElement::CompoundStatement { span, statements } => {
                let statement = ASTElement::new(ASTElementKind::CompoundStatement { span });
                for substatement_raw in statements {
                    statement.slot_push(self.parse_cst(substatement_raw, prefix));
                }
                statement
            }

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
            } => {
                let rc = self.parse_cst((*returntype).clone(), prefix).clone();
                let body = self.parse_cst((*body).clone(), prefix).clone();

                let handle = self.path_set(
                    &(prefix.to_owned() + "." + name),
                    ASTElement::new(ASTElementKind::Function {
                        span,
                        is_static: *is_static,
                        name: name.to_owned(),
                    }),
                );
                handle.slot_insert(FUNCTION_RETURN, rc);
                handle.slot_insert(FUNCTION_BODY, body);

                for arg in args {
                    if let CSTElement::TypedArgument {
                        span: _,
                        argname: CSTElement::Identifier { span: _, name },
                        argtype,
                    } = arg
                    {
                        let ty = self.parse_cst((*argtype).clone(), prefix).clone();
                        handle.slot_insert(name, ty);
                    } else {
                        unreachable!();
                    }
                }

                for throw in throws {
                    let throw_parsed = self.parse_cst(throw.clone(), prefix).clone();
                    handle.slot_push(throw_parsed);
                }

                handle
            }

            CSTElement::Identifier { span, name } => {
                ASTElement::new(ASTElementKind::UnresolvedIdentifier {
                    span,
                    name,
                    namespace: "name".to_owned(),
                })
            }

            CSTElement::LocalDefinitionStatement {
                span,
                localtype,
                name,
                initializer,
            } => {
                let statement =
                    ASTElement::new(ASTElementKind::LocalDefinitionStatement { span, name });
                statement.slot_insert(
                    LOCAL_DEFINITION_STATEMENT_INITIALIZER,
                    self.parse_cst(initializer.to_owned(), prefix),
                );
                statement.slot_insert(
                    LOCAL_DEFINITION_STATEMENT_TYPE,
                    self.parse_cst(localtype.to_owned(), prefix),
                );
                statement
            }

            CSTElement::RawPointerType { span, inner } => {
                let inner = self.parse_cst(inner.clone(), prefix).clone();
                let handle = ASTElement::new(ASTElementKind::RawPointerType { span });
                handle.slot_insert(RAW_POINTER_TYPE_INNER, inner);
                handle
            }

            CSTElement::ReturnStatement { span, source } => {
                let statement = ASTElement::new(ASTElementKind::ReturnStatement { span });
                source.map(|source| {
                    statement.slot_insert(
                        RETURN_STATEMENT_EXPRESSION,
                        self.parse_cst(source.clone(), prefix),
                    )
                });
                statement
            }

            CSTElement::SimpleStatement { span, expression } => {
                let statement = ASTElement::new(ASTElementKind::SimpleStatement { span });
                statement.slot_insert(
                    SIMPLE_STATEMENT_EXPRESSION,
                    self.parse_cst(expression.to_owned(), prefix),
                );
                statement
            }

            CSTElement::SpecifiedType {
                span,
                base,
                parameters:
                    CSTElement::TypeParameterList {
                        span: _,
                        parameters,
                    },
            } => {
                let base = self.parse_cst(base.clone(), prefix).clone();

                let handle = ASTElement::new(ASTElementKind::SpecifiedType { span });
                handle.slot_insert(SPECIFIED_TYPE_BASE, base);
                parameters.iter().for_each(|x| {
                    let param = self.parse_cst(x.clone(), prefix).clone();
                    handle.slot_push(param);
                });
                handle
            }

            _ => {
                log!(LogLevel::Warning, "unimplemented parse_cst {:?}", cst);
                ASTElement::new(ASTElementKind::Placeholder())
            }
        }
    }
}
