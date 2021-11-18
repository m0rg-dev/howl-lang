use crate::{
    ast::{
        generate_unique_name, ASTElement, ASTElementKind, ARITHMETIC_EXPRESSION_LHS,
        ARITHMETIC_EXPRESSION_RHS, ASSIGNMENT_STATEMENT_LHS, ASSIGNMENT_STATEMENT_RHS,
        CLASS_EXTENDS, CLASS_FIELD_TYPE, CONSTRUCTOR_CALL_EXPRESSION_SOURCE,
        ELSE_IF_STATEMENT_BODY, ELSE_IF_STATEMENT_CONDITION, ELSE_STATEMENT_BODY, FUNCTION_BODY,
        FUNCTION_CALL_EXPRESSION_SOURCE, FUNCTION_RETURN, IF_STATEMENT_BODY,
        IF_STATEMENT_CONDITION, INDEX_EXPRESSION_INDEX, INDEX_EXPRESSION_SOURCE,
        LOCAL_DEFINITION_STATEMENT_INITIALIZER, LOCAL_DEFINITION_STATEMENT_TYPE,
        RAW_POINTER_TYPE_INNER, RETURN_STATEMENT_EXPRESSION, SIMPLE_STATEMENT_EXPRESSION,
        SPECIFIED_TYPE_BASE, THROW_STATEMENT_EXPRESSION, WHILE_STATEMENT_BODY,
        WHILE_STATEMENT_CONDITION,
    },
    context::CompilationContext,
    log,
    logger::{LogLevel, Logger},
    parser::CSTElement,
};

macro_rules! slot_parse {
    ($self: expr, $target: expr, $slot: expr, $source: expr, $prefix: expr) => {
        $target.slot_insert($slot, $self.parse_cst($source.to_owned(), $prefix))
    };
}

macro_rules! push_parse {
    ($self: expr, $target: expr, $source: expr, $prefix: expr) => {
        $target.slot_push($self.parse_cst($source.to_owned(), $prefix))
    };
}

macro_rules! vec_push_parse {
    ($self: expr, $target: expr, $source: expr, $prefix: expr) => {{
        for item in $source {
            push_parse!($self, $target, item, $prefix);
        }
    }};
}

macro_rules! build_ast {
    (($self: expr, $prefix: expr, $kind: expr)
        vec => $vec: expr,
        $(
            $slot: expr => $source: expr
        ),*
    ) => {{
        let element = ASTElement::new($kind);
        $(
            slot_parse!($self, element, $slot, $source, $prefix);
        )*
        vec_push_parse!($self, element, $vec, $prefix);
        element
    }};

    (($self: expr, $prefix: expr, $kind: expr)
        $(
            $slot: expr => $source: expr
        ),*
    ) => {{
        let element = ASTElement::new($kind);
        $(
            slot_parse!($self, element, $slot, $source, $prefix);
        )*
        element
    }};
}

impl CompilationContext {
    pub fn parse_cst(&self, cst: CSTElement, prefix: &str) -> ASTElement {
        match cst {
            CSTElement::ArithmeticExpression {
                span,
                lhs,
                operator,
                rhs,
            } => build_ast! {
                (
                    self, prefix,
                    ASTElementKind::ArithmeticExpression { span, operator }
                )
                ARITHMETIC_EXPRESSION_LHS => lhs,
                ARITHMETIC_EXPRESSION_RHS => rhs
            },

            CSTElement::AssignmentStatement { span, lhs, rhs } => build_ast! {
                (
                    self, prefix,
                    ASTElementKind::AssignmentStatement { span }
                )
                ASSIGNMENT_STATEMENT_LHS => lhs,
                ASSIGNMENT_STATEMENT_RHS => rhs
            },

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
                }

                extends.map(|x| slot_parse!(self, class, CLASS_EXTENDS, x, &class_path));

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

            CSTElement::ConstructorCallExpression {
                span,
                source,
                args: CSTElement::ArgumentList { span: _, args },
            } => {
                let element = build_ast! {
                    (
                        self, prefix,
                        ASTElementKind::ConstructorCallExpression { span }
                    )
                    CONSTRUCTOR_CALL_EXPRESSION_SOURCE => source
                };
                vec_push_parse!(self, element, args, prefix);
                element
            }

            CSTElement::ElseStatement { span, body } => build_ast! {
                (
                    self, prefix,
                    ASTElementKind::ElseStatement { span }
                )
                ELSE_STATEMENT_BODY => body
            },

            CSTElement::ElseIfStatement {
                span,
                condition,
                body,
            } => build_ast! {
                (
                    self, prefix,
                    ASTElementKind::ElseIfStatement { span }
                )
                ELSE_IF_STATEMENT_CONDITION => condition,
                ELSE_IF_STATEMENT_BODY => body
            },

            CSTElement::FFICallExpression {
                span,
                name,
                args: CSTElement::ArgumentList { span: _, args },
            } => {
                let element = ASTElement::new(ASTElementKind::FFICallExpression { span, name });
                vec_push_parse!(self, element, args, prefix);
                element
            }

            CSTElement::Function {
                span: _,
                header,
                body,
            } => {
                let element = self.parse_cst(header.clone(), prefix);
                slot_parse!(self, element, FUNCTION_BODY, body, &element.path());

                element
            }

            CSTElement::FunctionCallExpression {
                span,
                source,
                args: CSTElement::ArgumentList { span: _, args },
            } => build_ast! {
                (
                    self, prefix,
                    ASTElementKind::FunctionCallExpression { span }
                )
                vec => args,
                FUNCTION_CALL_EXPRESSION_SOURCE => source
            },

            CSTElement::FunctionDeclaration {
                span,
                is_static,
                returntype,
                name: CSTElement::Identifier { span: _, name },
                args: CSTElement::TypedArgumentList { span: _, args },
                throws,
            } => {
                let unique_name = generate_unique_name(
                    name,
                    args.into_iter()
                        .map(|x| {
                            if let CSTElement::TypedArgument {
                                span: _,
                                argname: _,
                                argtype,
                            } = *x
                            {
                                self.parse_cst(argtype.clone(), prefix)
                            } else {
                                unreachable!()
                            }
                        })
                        .collect(),
                );
                let element = self.path_set(
                    &(prefix.to_owned() + "." + &unique_name),
                    ASTElement::new(ASTElementKind::Function {
                        span,
                        is_static,
                        name: name.to_owned(),
                        unique_name,
                    }),
                );
                slot_parse!(self, element, FUNCTION_RETURN, returntype, &element.path());

                for arg in args {
                    if let CSTElement::TypedArgument {
                        span: _,
                        argname: CSTElement::Identifier { span: _, name },
                        argtype,
                    } = arg
                    {
                        slot_parse!(self, element, name, *argtype, prefix);
                    } else {
                        unreachable!();
                    }
                }

                vec_push_parse!(self, element, throws, prefix);

                element
            }

            CSTElement::Identifier { span, name } => {
                ASTElement::new(ASTElementKind::UnresolvedIdentifier {
                    span,
                    name,
                    namespace: "name".to_owned(),
                })
            }

            CSTElement::IfStatement {
                span,
                condition,
                body,
            } => build_ast! {
                (
                    self, prefix,
                    ASTElementKind::IfStatement { span }
                )
                IF_STATEMENT_CONDITION => condition,
                IF_STATEMENT_BODY => body
            },

            CSTElement::IndexExpression {
                span,
                source,
                index,
            } => {
                let element = ASTElement::new(ASTElementKind::IndexExpression { span });
                slot_parse!(self, element, INDEX_EXPRESSION_SOURCE, source, prefix);
                slot_parse!(self, element, INDEX_EXPRESSION_INDEX, index, prefix);
                element
            }

            CSTElement::Interface {
                span,
                header:
                    CSTElement::InterfaceHeader {
                        span: _,
                        name: CSTElement::Identifier { span: _, name },
                        generics,
                    },
                body: CSTElement::InterfaceBody { span: _, elements },
            } => {
                let interface_path = prefix.to_owned() + "." + name;
                let element = self.path_set(
                    &interface_path,
                    ASTElement::new(ASTElementKind::Interface {
                        span,
                        name: name.clone(),
                    }),
                );

                for element in elements {
                    self.parse_cst(element.clone(), &interface_path);
                }

                if let Some(CSTElement::GenericList { span: _, names }) = generics {
                    for element in names {
                        if let CSTElement::Identifier { span: _, name } = element {
                            self.path_set(
                                &(interface_path.clone() + "." + name),
                                ASTElement::new(ASTElementKind::NewType { name: name.clone() }),
                            );
                        } else {
                            unreachable!()
                        }
                    }
                }

                element
            }

            CSTElement::LocalDefinitionStatement {
                span,
                localtype,
                name,
                initializer,
            } => {
                let statement =
                    ASTElement::new(ASTElementKind::LocalDefinitionStatement { span, name });
                slot_parse!(
                    self,
                    statement,
                    LOCAL_DEFINITION_STATEMENT_INITIALIZER,
                    initializer,
                    prefix
                );
                slot_parse!(
                    self,
                    statement,
                    LOCAL_DEFINITION_STATEMENT_TYPE,
                    localtype,
                    prefix
                );
                statement
            }

            CSTElement::NameExpression { span, name } => {
                ASTElement::new(ASTElementKind::NameExpression { span, name })
            }

            CSTElement::NumberExpression { span, as_text } => {
                ASTElement::new(ASTElementKind::NumberExpression {
                    span,
                    value: as_text,
                })
            }

            CSTElement::MacroCallExpression {
                span,
                name,
                args: CSTElement::ArgumentList { span: _, args },
            } => {
                let element = ASTElement::new(ASTElementKind::MacroCallExpression { span, name });
                vec_push_parse!(self, element, args, prefix);
                element
            }

            CSTElement::RawPointerType { span, inner } => {
                let handle = ASTElement::new(ASTElementKind::RawPointerType { span });
                slot_parse!(self, handle, RAW_POINTER_TYPE_INNER, inner, prefix);
                handle
            }

            CSTElement::ReturnStatement { span, source } => {
                let statement = ASTElement::new(ASTElementKind::ReturnStatement { span });
                source.map(|source| {
                    slot_parse!(self, statement, RETURN_STATEMENT_EXPRESSION, source, prefix)
                });
                statement
            }

            CSTElement::SimpleStatement { span, expression } => {
                let statement = ASTElement::new(ASTElementKind::SimpleStatement { span });
                slot_parse!(
                    self,
                    statement,
                    SIMPLE_STATEMENT_EXPRESSION,
                    expression,
                    prefix
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

            CSTElement::StringLiteral { span, contents } => {
                ASTElement::new(ASTElementKind::StringExpression {
                    span,
                    value: contents,
                })
            }

            CSTElement::ThrowStatement { span, source } => {
                let statement = ASTElement::new(ASTElementKind::ThrowStatement { span });
                statement.slot_insert(
                    THROW_STATEMENT_EXPRESSION,
                    self.parse_cst(source.clone(), prefix),
                );
                statement
            }

            CSTElement::WhileStatement {
                span,
                condition,
                body,
            } => build_ast! {
                (
                    self, prefix,
                    ASTElementKind::WhileStatement { span }
                )
                WHILE_STATEMENT_CONDITION => condition,
                WHILE_STATEMENT_BODY => body
            },

            _ => {
                log!(LogLevel::Warning, "unimplemented parse_cst {:?}", cst);
                ASTElement::new(ASTElementKind::Placeholder())
            }
        }
    }
}
