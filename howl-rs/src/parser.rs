use lrpar::Span;
use serde::ser::SerializeStruct;
use serde::Serialize;
use std::fmt::Debug;
use std::fmt::Formatter;
use std::ops::Deref;

// TODO have this use an arena or something
pub fn alloc<'a>(source: CSTElement<'a>) -> &'a CSTElement {
    return Box::leak(Box::new(source.clone()));
}

#[derive(Clone)]
pub struct SerializableSpan(lrpar::Span);

impl Serialize for SerializableSpan {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut s = serializer.serialize_struct("span", 2)?;
        s.serialize_field("start", &self.0.start())?;
        s.serialize_field("end", &self.0.end())?;
        s.end()
    }
}

impl Deref for SerializableSpan {
    type Target = lrpar::Span;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<Span> for SerializableSpan {
    fn from(a: Span) -> Self {
        Self(a)
    }
}

#[derive(Clone, Serialize)]
pub enum CSTElement<'a> {
    Class {
        span: SerializableSpan,
        header: &'a CSTElement<'a>,
        body: &'a CSTElement<'a>,
    },
    ClassBody {
        span: SerializableSpan,
        elements: Vec<CSTElement<'a>>,
    },
    ClassHeader {
        span: SerializableSpan,
        name: &'a CSTElement<'a>,
        generics: Option<&'a CSTElement<'a>>,
        extends: Option<&'a CSTElement<'a>>,
        implements: Vec<CSTElement<'a>>,
    },
    Interface {
        span: SerializableSpan,
        header: &'a CSTElement<'a>,
        body: &'a CSTElement<'a>,
    },
    InterfaceBody {
        span: SerializableSpan,
        elements: Vec<CSTElement<'a>>,
    },
    InterfaceHeader {
        span: SerializableSpan,
        name: &'a CSTElement<'a>,
        generics: Option<&'a CSTElement<'a>>,
    },
    GenericList {
        span: SerializableSpan,
        names: Vec<CSTElement<'a>>,
    },
    Identifier {
        span: SerializableSpan,
        name: String,
    },
    BaseType {
        span: SerializableSpan,
        name: String,
    },
    RawPointerType {
        span: SerializableSpan,
        inner: &'a CSTElement<'a>,
    },
    SpecifiedType {
        span: SerializableSpan,
        base: &'a CSTElement<'a>,
        parameters: &'a CSTElement<'a>,
    },
    TypeParameterList {
        span: SerializableSpan,
        parameters: Vec<CSTElement<'a>>,
    },
    ClassField {
        span: SerializableSpan,
        fieldtype: &'a CSTElement<'a>,
        fieldname: &'a CSTElement<'a>,
    },
    Function {
        span: SerializableSpan,
        header: &'a CSTElement<'a>,
        body: &'a CSTElement<'a>,
    },
    FunctionDeclaration {
        span: SerializableSpan,
        is_static: bool,
        returntype: &'a CSTElement<'a>,
        name: &'a CSTElement<'a>,
        args: &'a CSTElement<'a>,
        throws: Vec<CSTElement<'a>>,
    },
    TypedArgumentList {
        span: SerializableSpan,
        args: Vec<CSTElement<'a>>,
    },
    TypedArgument {
        span: SerializableSpan,
        argtype: &'a CSTElement<'a>,
        argname: &'a CSTElement<'a>,
    },
    CompoundStatement {
        span: SerializableSpan,
        statements: Vec<CSTElement<'a>>,
    },
    SimpleStatement {
        span: SerializableSpan,
        expression: &'a CSTElement<'a>,
    },
    AssignmentStatement {
        span: SerializableSpan,
        lhs: &'a CSTElement<'a>,
        rhs: &'a CSTElement<'a>,
    },
    NameExpression {
        span: SerializableSpan,
        name: String,
    },
    FieldReferenceExpression {
        span: SerializableSpan,
        source: &'a CSTElement<'a>,
        name: String,
    },
    ArgumentList {
        span: SerializableSpan,
        args: Vec<CSTElement<'a>>,
    },
    FunctionCallExpression {
        span: SerializableSpan,
        source: &'a CSTElement<'a>,
        args: &'a CSTElement<'a>,
    },
    FFICallExpression {
        span: SerializableSpan,
        name: String,
        args: &'a CSTElement<'a>,
    },
    MacroCallExpression {
        span: SerializableSpan,
        name: String,
        args: &'a CSTElement<'a>,
    },
    ConstructorCallExpression {
        span: SerializableSpan,
        source: &'a CSTElement<'a>,
        args: &'a CSTElement<'a>,
    },
    NumberExpression {
        span: SerializableSpan,
        as_text: String,
    },
    IndexExpression {
        span: SerializableSpan,
        source: &'a CSTElement<'a>,
        index: &'a CSTElement<'a>,
    },
    ArithmeticExpression {
        span: SerializableSpan,
        operator: String,
        lhs: &'a CSTElement<'a>,
        rhs: &'a CSTElement<'a>,
    },
    ReturnStatement {
        span: SerializableSpan,
        source: Option<&'a CSTElement<'a>>,
    },
    ThrowStatement {
        span: SerializableSpan,
        source: &'a CSTElement<'a>,
    },
    IfStatement {
        span: SerializableSpan,
        condition: &'a CSTElement<'a>,
        body: &'a CSTElement<'a>,
    },
    ElseIfStatement {
        span: SerializableSpan,
        condition: &'a CSTElement<'a>,
        body: &'a CSTElement<'a>,
    },
    ElseStatement {
        span: SerializableSpan,
        body: &'a CSTElement<'a>,
    },
    TryStatement {
        span: SerializableSpan,
        body: &'a CSTElement<'a>,
    },
    CatchStatement {
        span: SerializableSpan,
        exctype: &'a CSTElement<'a>,
        excname: String,
        body: &'a CSTElement<'a>,
    },
    WhileStatement {
        span: SerializableSpan,
        condition: &'a CSTElement<'a>,
        body: &'a CSTElement<'a>,
    },
    LocalDefinitionStatement {
        span: SerializableSpan,
        localtype: &'a CSTElement<'a>,
        name: String,
        initializer: &'a CSTElement<'a>,
    },
    StringLiteral {
        span: SerializableSpan,
        contents: String,
    },
}

impl Debug for CSTElement<'_> {
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
            CSTElement::IndexExpression {
                span: _,
                source,
                index,
            } => write!(f, "{:?}[{:?}]", source, index),
        }
    }
}
