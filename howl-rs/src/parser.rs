use lrpar::Span;
use serde::ser::SerializeStruct;
use serde::Serialize;
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
    SpecifiedTypeExpression {
        span: SerializableSpan,
        base: &'a CSTElement<'a>,
        parameters: &'a CSTElement<'a>,
    },
    ClassField {
        span: SerializableSpan,
        fieldtype: &'a CSTElement<'a>,
        fieldname: &'a CSTElement<'a>,
        is_static: bool,
    },
    Function {
        span: SerializableSpan,
        header: &'a CSTElement<'a>,
        body: &'a CSTElement<'a>,
    },
    FunctionDeclaration {
        span: SerializableSpan,
        is_static: bool,
        is_extern: bool,
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
    FunctionType {
        span: SerializableSpan,
        returntype: &'a CSTElement<'a>,
        args: &'a CSTElement<'a>,
    },
    ImportStatement {
        span: SerializableSpan,
        path: String,
    },
    ModStatement {
        span: SerializableSpan,
        path: String,
    },
    BooleanInversionExpression {
        span: SerializableSpan,
        source: &'a CSTElement<'a>,
    },
    TypeConstraint {
        span: SerializableSpan,
        source: &'a CSTElement<'a>,
        ctype: &'a CSTElement<'a>,
    },
}
