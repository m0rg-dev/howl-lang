use lrpar::Span;
use std::fmt::Debug;
use std::fmt::Formatter;

pub enum CSTElement {
    Class {
        span: Span,
        header: Box<CSTElement>,
        body: Box<CSTElement>,
    },
    ClassBody {
        span: Span,
        elements: Vec<CSTElement>,
    },
    ClassHeader {
        span: Span,
        name: Box<CSTElement>,
        generics: Option<Box<CSTElement>>,
        extends: Option<Box<CSTElement>>,
        implements: Vec<CSTElement>,
    },
    Interface {
        span: Span,
        header: Box<CSTElement>,
        body: Box<CSTElement>,
    },
    InterfaceBody {
        span: Span,
        elements: Vec<CSTElement>,
    },
    InterfaceHeader {
        span: Span,
        name: Box<CSTElement>,
        generics: Option<Box<CSTElement>>,
    },
    GenericList {
        span: Span,
        names: Vec<CSTElement>,
    },
    Identifier {
        span: Span,
        name: String,
    },
    BaseType {
        span: Span,
        name: String,
    },
    RawPointerType {
        span: Span,
        inner: Box<CSTElement>,
    },
    SpecifiedType {
        span: Span,
        base: Box<CSTElement>,
        parameters: Box<CSTElement>,
    },
    TypeParameterList {
        span: Span,
        parameters: Vec<CSTElement>,
    },
    ClassField {
        span: Span,
        fieldtype: Box<CSTElement>,
        fieldname: Box<CSTElement>,
    },
    Function {
        span: Span,
        header: Box<CSTElement>,
        body: Box<CSTElement>,
    },
    FunctionDeclaration {
        span: Span,
        is_static: bool,
        returntype: Box<CSTElement>,
        name: Box<CSTElement>,
        args: Box<CSTElement>,
        throws: Vec<CSTElement>,
    },
    TypedArgumentList {
        span: Span,
        args: Vec<CSTElement>,
    },
    TypedArgument {
        span: Span,
        argtype: Box<CSTElement>,
        argname: Box<CSTElement>,
    },
    CompoundStatement {
        span: Span,
        statements: Vec<CSTElement>,
    },
    SimpleStatement {
        span: Span,
        expression: Box<CSTElement>,
    },
    AssignmentStatement {
        span: Span,
        lhs: Box<CSTElement>,
        rhs: Box<CSTElement>,
    },
    NameExpression {
        span: Span,
        name: String,
    },
    FieldReferenceExpression {
        span: Span,
        source: Box<CSTElement>,
        name: String,
    },
    ArgumentList {
        span: Span,
        args: Vec<CSTElement>,
    },
    FunctionCallExpression {
        span: Span,
        source: Box<CSTElement>,
        args: Box<CSTElement>,
    },
    FFICallExpression {
        span: Span,
        name: String,
        args: Box<CSTElement>,
    },
    MacroCallExpression {
        span: Span,
        name: String,
        args: Box<CSTElement>,
    },
    ConstructorCallExpression {
        span: Span,
        source: Box<CSTElement>,
        args: Box<CSTElement>,
    },
    NumberExpression {
        span: Span,
        as_text: String,
    },
    IndexExpression {
        span: Span,
        source: Box<CSTElement>,
        index: Box<CSTElement>,
    },
    ArithmeticExpression {
        span: Span,
        operator: String,
        lhs: Box<CSTElement>,
        rhs: Box<CSTElement>,
    },
    ReturnStatement {
        span: Span,
        source: Option<Box<CSTElement>>,
    },
    ThrowStatement {
        span: Span,
        source: Box<CSTElement>,
    },
    IfStatement {
        span: Span,
        condition: Box<CSTElement>,
        body: Box<CSTElement>,
    },
    ElseIfStatement {
        span: Span,
        condition: Box<CSTElement>,
        body: Box<CSTElement>,
    },
    ElseStatement {
        span: Span,
        body: Box<CSTElement>,
    },
    TryStatement {
        span: Span,
        body: Box<CSTElement>,
    },
    CatchStatement {
        span: Span,
        exctype: Box<CSTElement>,
        excname: String,
        body: Box<CSTElement>,
    },
    WhileStatement {
        span: Span,
        condition: Box<CSTElement>,
        body: Box<CSTElement>,
    },
    LocalDefinitionStatement {
        span: Span,
        localtype: Box<CSTElement>,
        name: String,
        initializer: Box<CSTElement>,
    },
    StringLiteral {
        span: Span,
        contents: String,
    },
    Comment {
        span: Span,
        as_text: String,
    },
}

impl Debug for CSTElement {
    fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
        match self {
            CSTElement::Class {
                span: _,
                header,
                body,
            } => f
                .debug_struct("Class")
                .field("header", header)
                .field("body", body)
                .finish(),

            CSTElement::ClassHeader {
                span: _,
                name,
                generics,
                extends,
                implements,
            } => f
                .debug_struct("ClassHeader")
                .field("name", name)
                .field("generics", generics)
                .field("extends", extends)
                .field("implements", implements)
                .finish(),

            CSTElement::ClassBody { span: _, elements } => {
                let mut builder = f.debug_tuple("ClassBody");
                elements.iter().for_each(|e| {
                    builder.field(e);
                });
                builder.finish()
            }

            CSTElement::Interface {
                span: _,
                header,
                body,
            } => f
                .debug_struct("Interface")
                .field("header", header)
                .field("body", body)
                .finish(),

            CSTElement::InterfaceHeader {
                span: _,
                name,
                generics,
            } => {
                write!(f, "{:?}", name)?;
                if let Some(g) = generics {
                    write!(f, "{:?}", g)?;
                }
                Ok(())
            }

            CSTElement::InterfaceBody { span: _, elements } => {
                let mut builder = f.debug_tuple("InterfaceBody");
                elements.iter().for_each(|e| {
                    builder.field(e);
                });
                builder.finish()
            }

            CSTElement::CompoundStatement {
                span: _,
                statements,
            } => {
                let mut builder = f.debug_tuple("CompoundStatement");
                statements.iter().for_each(|e| {
                    builder.field(e);
                });
                builder.finish()
            }

            CSTElement::SimpleStatement {
                span: _,
                expression,
            } => f
                .debug_struct("SimpleStatement")
                .field("expression", expression)
                .finish(),

            CSTElement::AssignmentStatement { span: _, lhs, rhs } => f
                .debug_struct("AssignmentStatement")
                .field("lhs", lhs)
                .field("rhs", rhs)
                .finish(),

            CSTElement::ArithmeticExpression {
                span: _,
                operator,
                lhs,
                rhs,
            } => f
                .debug_struct("ArithmeticExpression")
                .field("operator", operator)
                .field("lhs", lhs)
                .field("rhs", rhs)
                .finish(),

            CSTElement::ClassField {
                span: _,
                fieldtype,
                fieldname,
            } => {
                write!(f, "{:?} {:?}", fieldtype, fieldname)
            }

            CSTElement::TypedArgument {
                span: _,
                argtype,
                argname,
            } => {
                write!(f, "{:?} {:?}", argtype, argname)
            }

            CSTElement::Function {
                span: _,
                header,
                body,
            } => f
                .debug_struct("Function")
                .field("header", header)
                .field("body", body)
                .finish(),

            CSTElement::FunctionDeclaration {
                span: _,
                is_static,
                returntype,
                name,
                args,
                throws,
            } => f
                .debug_struct("FunctionDeclaration")
                .field("is_static", is_static)
                .field("return_type", returntype)
                .field("name", name)
                .field("args", args)
                .field("throws", throws)
                .finish(),

            CSTElement::RawPointerType { span: _, inner } => {
                write!(f, "*{:?}", inner)
            }

            CSTElement::SpecifiedType {
                span: _,
                base,
                parameters,
            } => {
                write!(f, "{:?}{:?}", base, parameters)
            }

            CSTElement::TypeParameterList {
                span: _,
                parameters,
            } => {
                write!(
                    f,
                    "<{}>",
                    parameters
                        .iter()
                        .map(|x| format!("{:?}", x))
                        .collect::<Vec<String>>()
                        .join(", ")
                )
            }

            CSTElement::GenericList { span: _, names } => {
                write!(
                    f,
                    "<{}>",
                    names
                        .iter()
                        .map(|x| format!("{:?}", x))
                        .collect::<Vec<String>>()
                        .join(", ")
                )
            }

            CSTElement::TypedArgumentList { span: _, args } => {
                write!(
                    f,
                    "({})",
                    args.iter()
                        .map(|x| format!("{:?}", x))
                        .collect::<Vec<String>>()
                        .join(", ")
                )
            }

            CSTElement::ArgumentList { span: _, args } => {
                let mut builder = f.debug_tuple("ArgumentList");
                args.iter().for_each(|e| {
                    builder.field(e);
                });
                builder.finish()
            }

            CSTElement::FieldReferenceExpression {
                span: _,
                source,
                name,
            } => {
                write!(f, "{:?}.{}", source, name)
            }

            CSTElement::FunctionCallExpression {
                span: _,
                source,
                args,
            } => f
                .debug_struct("FunctionCall")
                .field("source", source)
                .field("args", args)
                .finish(),

            CSTElement::FFICallExpression {
                span: _,
                name,
                args,
            } => f
                .debug_struct("FFICall")
                .field("name", name)
                .field("args", args)
                .finish(),

            CSTElement::MacroCallExpression {
                span: _,
                name,
                args,
            } => f
                .debug_struct("MacroCall")
                .field("name", name)
                .field("args", args)
                .finish(),

            CSTElement::ConstructorCallExpression {
                span: _,
                source,
                args,
            } => f
                .debug_struct("ConstructorCall")
                .field("source", source)
                .field("args", args)
                .finish(),

            CSTElement::ReturnStatement { span: _, source } => {
                if let Some(s) = source {
                    write!(f, "return {:?};", s)
                } else {
                    write!(f, "return;")
                }
            }

            CSTElement::ThrowStatement { span: _, source } => {
                write!(f, "throw {:?};", source)
            }

            CSTElement::TryStatement { span: _, body } => {
                f.debug_struct("TryStatement").field("body", body).finish()
            }

            CSTElement::CatchStatement {
                span: _,
                exctype,
                excname,
                body,
            } => f
                .debug_struct("CatchStatement")
                .field("exctype", exctype)
                .field("excname", excname)
                .field("body", body)
                .finish(),

            CSTElement::IfStatement {
                span: _,
                condition,
                body,
            } => f
                .debug_struct("IfStatement")
                .field("condition", condition)
                .field("body", body)
                .finish(),

            CSTElement::ElseIfStatement {
                span: _,
                condition,
                body,
            } => f
                .debug_struct("ElseIfStatement")
                .field("condition", condition)
                .field("body", body)
                .finish(),

            CSTElement::ElseStatement { span: _, body } => {
                f.debug_struct("ElseStatement").field("body", body).finish()
            }

            CSTElement::WhileStatement {
                span: _,
                condition,
                body,
            } => f
                .debug_struct("WhileStatement")
                .field("condition", condition)
                .field("body", body)
                .finish(),

            CSTElement::LocalDefinitionStatement {
                span: _,
                localtype,
                name,
                initializer,
            } => f
                .debug_struct("LocalDefinitionStatement")
                .field("type", localtype)
                .field("name", name)
                .field("initializer", initializer)
                .finish(),

            CSTElement::Identifier { span: _, name } => write!(f, "'{}", name),
            CSTElement::BaseType { span: _, name } => write!(f, "'{}", name),
            CSTElement::NameExpression { span: _, name } => write!(f, "'{}", name),
            CSTElement::NumberExpression { span: _, as_text } => write!(f, "#{}", as_text),
            CSTElement::StringLiteral { span: _, contents } => write!(f, "${}", contents),
            CSTElement::Comment { span: _, as_text } => write!(f, "{}", as_text),
            CSTElement::IndexExpression {
                span: _,
                source,
                index,
            } => write!(f, "{:?}[{:?}]", source, index),
        }
    }
}
