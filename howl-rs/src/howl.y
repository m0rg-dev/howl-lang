%start Program
%%
Program -> Result<Vec<CSTElement<'input>>, ()>:
    ProgramElement { Ok(vec![$1?]) }
    | Program ProgramElement { flatten($1, $2) }
    ;

ProgramElement -> Result<CSTElement<'input>, ()>:
    ClassHeader ClassBody {
        Ok(CSTElement::Class{ span: $span.into(), header: alloc($1?), body: alloc($2?) })
    }
    | InterfaceHeader InterfaceBody {
        Ok(CSTElement::Interface{ span: $span.into(), header: alloc($1?), body: alloc($2?) })
    }
    | Function {
        Ok($1?)
    }
    | ExternFunctionHeader ';' { Ok($1?) }
    | 'IMPORT' 'identifier' ';' {
        Ok(CSTElement::ImportStatement{ span: $span.into(), path: $lexer.span_str($2.as_ref().unwrap().span()).to_string() })
    }
    | 'MOD' 'identifier' ';' {
        Ok(CSTElement::ModStatement{ span: $span.into(), path: $lexer.span_str($2.as_ref().unwrap().span()).to_string() })
    }
    ;

ClassHeader -> Result<CSTElement<'input>, ()>:
    ClassNameAndGenerics 'EXTENDS' Identifier ImplementsList {
        match $3 {
            Ok(_) => {
                let inner = $1?;
                Ok(CSTElement::ClassHeader{ span: $span.into(), name: inner.0, generics: inner.1, extends: Some(alloc($3?)), implements: $4? })
            }
            Err(_) => Err(())
        }
    }
    | ClassNameAndGenerics ImplementsList {
        let inner = $1?;
        Ok(CSTElement::ClassHeader{ span: $span.into(), name: inner.0, generics: inner.1, extends: None, implements: $2? })
    }
    ;

ClassNameAndGenerics -> Result<(&'input CSTElement<'input>, Option<&'input CSTElement<'input>>), ()>:
    'CLASS' Identifier GenericList {
        Ok((alloc($2?), Some(alloc($3?))))
    }
    | 'CLASS' Identifier {
        Ok((alloc($2?), None))
    }
    ;

ImplementsList -> Result<Vec<CSTElement<'input>>, ()>:
    /* empty */ { Ok(vec![]) }
    | 'IMPLEMENTS' Type { Ok(vec![$2?]) }
    | ImplementsList ',' Type { flatten($1, $3) }
    ;

ClassField -> Result<CSTElement<'input>, ()>:
    'STATIC' Type Identifier ';' {
        Ok(CSTElement::ClassField{ span: $span.into(), fieldtype: alloc($2?), fieldname: alloc($3?), is_static: true })
    }
    | Type Identifier ';' {
        Ok(CSTElement::ClassField{ span: $span.into(), fieldtype: alloc($1?), fieldname: alloc($2?), is_static: false })
    }
    ;

ClassBody -> Result<CSTElement<'input>, ()>:
    '{' '}' { Ok(CSTElement::ClassBody{ span: $span.into(), elements: vec![] }) }
    | '{' ClassBodyInner '}' { Ok(CSTElement::ClassBody{ span: $span.into(), elements: $2? }) }
    ;

ClassBodyInner -> Result<Vec<CSTElement<'input>>, ()>:
    ClassField { Ok(vec![$1?]) }
    | ExternFunctionHeader ';' { Ok(vec![$1?]) }
    | Function { Ok(vec![$1?]) }
    | ClassBodyInner ClassField { flatten($1, $2) }
    | ClassBodyInner Function { flatten($1, $2) }
    | ClassBodyInner ExternFunctionHeader ';' { flatten($1, $2) }
    ;

InterfaceHeader -> Result<CSTElement<'input>, ()>:
    'INTERFACE' Identifier GenericList {
        Ok(CSTElement::InterfaceHeader{ span: $span.into(), name: alloc($2?), generics: Some(alloc($3?)) })
    }
    | 'INTERFACE' Identifier {
        Ok(CSTElement::InterfaceHeader{ span: $span.into(), name: alloc($2?), generics: None})
    }
    ;


InterfaceBody -> Result<CSTElement<'input>, ()>:
    '{' '}' { Ok(CSTElement::InterfaceBody{ span: $span.into(), elements: vec![] }) }
    | '{' InterfaceBodyInner '}' { Ok(CSTElement::InterfaceBody{ span: $span.into(), elements: $2? }) }
    ;

InterfaceBodyInner -> Result<Vec<CSTElement<'input>>, ()>:
    FunctionHeader ';' { Ok(vec![$1?]) }
    | InterfaceBodyInner FunctionHeader ';' { flatten($1, $2) }
    ;

Function -> Result<CSTElement<'input>, ()>:
    FunctionHeader CompoundStatement {
        Ok(CSTElement::Function{ span: $span.into(), header: alloc($1?), body: alloc($2?) })
    }
    ;

ExternFunctionHeader -> Result<CSTElement<'input>, ()>:
    'EXTERN' 'FN' Type Identifier TypedArgumentList ThrowsList { 
        Ok(CSTElement::FunctionDeclaration{
            span: $span.into(),
            is_static: false,
            is_extern: true,
            returntype: alloc($3?),
            name: alloc($4?),
            args: alloc($5?),
            throws: $6?
        })
    }
    ;

FunctionHeader -> Result<CSTElement<'input>, ()>:
    'STATIC' 'FN' Type Identifier TypedArgumentList ThrowsList { 
        Ok(CSTElement::FunctionDeclaration{
            span: $span.into(),
            is_static: true,
            is_extern: false,
            returntype: alloc($3?),
            name: alloc($4?),
            args: alloc($5?),
            throws: $6?
        })
    }
    | 'FN' Type Identifier TypedArgumentList ThrowsList { 
        Ok(CSTElement::FunctionDeclaration{
            span: $span.into(),
            is_static: false,
            is_extern: false,
            returntype: alloc($2?),
            name: alloc($3?),
            args: alloc($4?),
            throws: $5?
        })
    }
    ;

ThrowsList -> Result<Vec<CSTElement<'input>>, ()>:
    /* empty */ { Ok(vec![]) }
    | 'THROWS' Type { Ok(vec![$2?]) }
    | ThrowsList ',' Type { flatten($1, $3) }
    ;

TypedArgumentList -> Result<CSTElement<'input>, ()>:
    '(' ')' { Ok(CSTElement::TypedArgumentList{ span: $span.into(), args: vec![] }) }
    | '(' TypedArgumentListInner ')' { Ok(CSTElement::TypedArgumentList{span: $span.into(), args: $2? }) }
    ;

TypedArgumentListInner -> Result<Vec<CSTElement<'input>>, ()>:
    TypedArgument { Ok(vec![$1?]) }
    | TypedArgumentListInner ',' TypedArgument { flatten($1, $3) }
    ;

TypedArgument -> Result<CSTElement<'input>, ()>:
    Type Identifier { Ok(CSTElement::TypedArgument{span: $span.into(), argtype: alloc($1?), argname: alloc($2?) }) }
    ;

CompoundStatement -> Result<CSTElement<'input>, ()>:
    '{' '}' { Ok(CSTElement::CompoundStatement{ span: $span.into(), statements: vec![] }) }
    | '{' CompoundStatementInner '}' { Ok(CSTElement::CompoundStatement{ span: $span.into(), statements: $2? }) }
    ;

CompoundStatementInner -> Result<Vec<CSTElement<'input>>, ()>:
    Statement { Ok(vec![$1?]) }
    | CompoundStatementInner Statement { flatten($1, $2) }
    ;

Statement -> Result<CSTElement<'input>, ()>:
    SimpleStatement { $1 }
    | AssignmentStatement { $1 }
    | CompoundStatement { $1 }
    | ReturnStatement { $1 }
    | IfStatement { $1 }
    | ElseIfStatement { $1 }
    | ElseStatement { $1 }
    | WhileStatement { $1 }
    | LocalDefinitionStatement { $1 }
    | ThrowStatement { $1 }
    | TryStatement { $1 }
    | CatchStatement { $1 }
    ;

SimpleStatement -> Result<CSTElement<'input>, ()>:
    Expression ';' { Ok(CSTElement::SimpleStatement{ span: $span.into(), expression: alloc($1?) }) }
    ;

AssignmentStatement -> Result<CSTElement<'input>, ()>:
    Expression '=' Expression ';' { Ok(CSTElement::AssignmentStatement{ span: $span.into(), lhs: alloc($1?), rhs: alloc($3?) }) }
    ;

ReturnStatement -> Result<CSTElement<'input>, ()>:
    'RETURN' Expression ';' { Ok(CSTElement::ReturnStatement{ span: $span.into(), source: Some(alloc($2?)) }) }
    | 'RETURN' ';' { Ok(CSTElement::ReturnStatement{ span: $span.into(), source: None }) }
    ;

ThrowStatement -> Result<CSTElement<'input>, ()>:
    'THROW' Expression ';' { Ok(CSTElement::ThrowStatement{ span: $span.into(), source: alloc($2?) }) }
    ;

TryStatement -> Result<CSTElement<'input>, ()>:
    'TRY' CompoundStatement { Ok(CSTElement::TryStatement{span: $span.into(), body: alloc($2?) }) }
    ;

CatchStatement -> Result<CSTElement<'input>, ()>:
    'CATCH' Type 'identifier' CompoundStatement {
        match $3 {
            Ok(_) => Ok(CSTElement::CatchStatement{
                span: $span.into(),
                exctype: alloc($2?),
                excname: $lexer.span_str($3.as_ref().unwrap().span()).to_string(),
                body: alloc($4?)
            }),
            Err(_) => Err(())
        }
    }
    ;

IfStatement -> Result<CSTElement<'input>, ()>:
    'IF' Expression CompoundStatement { Ok(CSTElement::IfStatement{span: $span.into(), condition: alloc($2?), body: alloc($3?) }) }
    ;

ElseIfStatement -> Result<CSTElement<'input>, ()>:
    'ELSE' 'IF' Expression CompoundStatement { Ok(CSTElement::ElseIfStatement{span: $span.into(), condition: alloc($3?), body: alloc($4?) }) }
    ;

ElseStatement -> Result<CSTElement<'input>, ()>:
    'ELSE' CompoundStatement { Ok(CSTElement::ElseStatement{span: $span.into(), body: alloc($2?) }) }
    ;

WhileStatement -> Result<CSTElement<'input>, ()>:
    'WHILE' Expression CompoundStatement { Ok(CSTElement::WhileStatement{span: $span.into(), condition: alloc($2?), body: alloc($3?) }) }
    ;

LocalDefinitionStatement -> Result<CSTElement<'input>, ()>:
    'LET' Type 'identifier' '=' Expression ';' {
        match $3 {
            Ok(_) => Ok(CSTElement::LocalDefinitionStatement{
                span: $span.into(),
                localtype: alloc($2?),
                name: $lexer.span_str($3.as_ref().unwrap().span()).to_string(),
                initializer: alloc($5?)
            }),
            Err(_) => Err(())
        }
    }
    ;

Expression -> Result<CSTElement<'input>, ()>:
    Expression '>' '=' Expression1 {
        Ok(CSTElement::ArithmeticExpression{span: $span.into(), operator: ">=".to_string(), lhs: alloc($1?), rhs: alloc($4?)})
    }
    | Expression '>' Expression1 {
        Ok(CSTElement::ArithmeticExpression{span: $span.into(), operator: ">".to_string(), lhs: alloc($1?), rhs: alloc($3?)})
    }
    | Expression '=' '=' Expression1 {
        Ok(CSTElement::ArithmeticExpression{span: $span.into(), operator: "==".to_string(), lhs: alloc($1?), rhs: alloc($4?)})
    }
    | Expression '!' '=' Expression1 {
        Ok(CSTElement::ArithmeticExpression{span: $span.into(), operator: "!=".to_string(), lhs: alloc($1?), rhs: alloc($4?)})
    }
    | Expression '<' Expression1 {
        Ok(CSTElement::ArithmeticExpression{span: $span.into(), operator: "<".to_string(), lhs: alloc($1?), rhs: alloc($3?)})
    }
    | Expression '<' '=' Expression1 {
        Ok(CSTElement::ArithmeticExpression{span: $span.into(), operator: "<=".to_string(), lhs: alloc($1?), rhs: alloc($4?)})
    }
    | Expression1 { $1 }
    ;

Expression1 -> Result<CSTElement<'input>, ()>:
    Expression1 '+' Expression2 {
        Ok(CSTElement::ArithmeticExpression{span: $span.into(), operator: "+".to_string(), lhs: alloc($1?), rhs: alloc($3?)})
    }
    | Expression1 '-' Expression2 {
        Ok(CSTElement::ArithmeticExpression{span: $span.into(), operator: "-".to_string(), lhs: alloc($1?), rhs: alloc($3?)})
    }
    | Expression2 { $1 }
    ;

Expression2 -> Result<CSTElement<'input>, ()>:
    Expression2 '*' Expression3 {
        Ok(CSTElement::ArithmeticExpression{span: $span.into(), operator: "*".to_string(), lhs: alloc($1?), rhs: alloc($3?)})
    }
    | Expression2 '/' Expression3 {
        Ok(CSTElement::ArithmeticExpression{span: $span.into(), operator: "/".to_string(), lhs: alloc($1?), rhs: alloc($3?)})
    }
    | Expression2 '%' Expression3 {
        Ok(CSTElement::ArithmeticExpression{span: $span.into(), operator: "%".to_string(), lhs: alloc($1?), rhs: alloc($3?)})
    }
    | '!' Expression3 {
        Ok(CSTElement::BooleanInversionExpression{span: $span.into(), source: alloc($2?)})
    }
    | Expression3 { $1 }
    ;

Expression3 -> Result<CSTElement<'input>, ()>:
    'identifier' { 
        match $1 {
            Ok(_) => Ok(CSTElement::NameExpression{span: $span.into(), name: $lexer.span_str($1.as_ref().unwrap().span()).to_string()}),
            Err(_) => Err(())
        }
    }
    | 'number' { 
        match $1 {
            Ok(_) => Ok(CSTElement::NumberExpression{span: $span.into(), as_text: $lexer.span_str($1.as_ref().unwrap().span()).to_string()}),
            Err(_) => Err(())
        }
    }
    | 'string' { 
        match $1 {
            Ok(_) => Ok(CSTElement::StringLiteral{span: $span.into(), contents: $lexer.span_str($1.as_ref().unwrap().span()).to_string()}),
            Err(_) => Err(())
        }
    }
    | Expression3 ':' ':' TypeParameterList { Ok(CSTElement::SpecifiedTypeExpression{span: $span.into(), base: alloc($1?), parameters: alloc($4?) }) }
    | Expression3 '.' 'identifier' {
        match $3 {
            Ok(_) => Ok(CSTElement::FieldReferenceExpression{span: $span.into(), source: alloc($1?), name: $lexer.span_str($3.as_ref().unwrap().span()).to_string()}),
            Err(_) => Err(())
        }
    }
    | Expression3 '[' Expression ']' {
        Ok(CSTElement::IndexExpression{span: $span.into(), source: alloc($1?), index: alloc($3?)})
    }
    | Expression3 ArgumentList {
        Ok(CSTElement::FunctionCallExpression{span: $span.into(), source: alloc($1?), args: alloc($2?)})
    }
    | "NEW" Type ArgumentList {
        Ok(CSTElement::ConstructorCallExpression{span: $span.into(), source: alloc($2?), args: alloc($3?)})
    }
    | "$" 'identifier' ArgumentList {
        match $2 {
            Ok(_) => Ok(CSTElement::MacroCallExpression{span: $span.into(), name: $lexer.span_str($2.as_ref().unwrap().span()).to_string(), args: alloc($3?)}),
            Err(_) => Err(())
        }
    }
    | '(' Expression ')' { $2 }
    ;

ArgumentList -> Result<CSTElement<'input>, ()>:
    '(' ')' { Ok(CSTElement::ArgumentList{ span: $span.into(), args: vec![] }) }
    | '(' ArgumentListInner ')' { Ok(CSTElement::ArgumentList{span: $span.into(), args: $2? }) }
    ;

ArgumentListInner -> Result<Vec<CSTElement<'input>>, ()>:
    Expression { Ok(vec![$1?]) }
    | ArgumentListInner ',' Expression { flatten($1, $3) }
    ;

Type -> Result<CSTElement<'input>, ()>:
    '*' Type1 { Ok(CSTElement::RawPointerType{span: $span.into(), inner: alloc($2?)}) }
    | Type1 { Ok($1?) }
    ;

Type1 -> Result<CSTElement<'input>, ()>:
    '(' Type ')' { Ok($2?) }
    | Type1 TypeParameterList { Ok(CSTElement::SpecifiedType{span: $span.into(), base: alloc($1?), parameters: alloc($2?) }) }
    | 'FN' Type1 TypedArgumentList { Ok(CSTElement::FunctionType{span: $span.into(), returntype: alloc($2?), args: alloc($3?) }) }
    | 'identifier' { 
        match $1 {
            Ok(_) => Ok(CSTElement::BaseType{span: $span.into(), name: $lexer.span_str($1.as_ref().unwrap().span()).to_string()}),
            Err(_) => Err(())
        }
    }
    ;

TypeParameterList -> Result<CSTElement<'input>, ()>: 
    '<' TypeParameterListInner '>' { Ok(CSTElement::TypeParameterList{span: $span.into(), parameters: $2? }) }
    ;

TypeParameterListInner -> Result<Vec<CSTElement<'input>>, ()>:
    Type { Ok(vec![$1?]) }
    | TypeParameterListInner ',' Type { flatten($1, $3) }
    ;

GenericList -> Result<CSTElement<'input>, ()>:
    '<' GenericListInner '>' { Ok(CSTElement::GenericList{span: $span.into(), names: $2? }) }
    ;

GenericListInner -> Result<Vec<CSTElement<'input>>, ()>:
    Identifier { Ok(vec![$1?]) }
    | GenericListInner ',' Identifier { flatten($1, $3) }
    ;

Identifier -> Result<CSTElement<'input>, ()>:
    'identifier' {
        match $1 {
            Ok(_) => Ok(CSTElement::Identifier{span: $span.into(), name: $lexer.span_str($1.as_ref().unwrap().span()).to_string()}),
            Err(_) => Err(())
        }
    }
    ;

Unmatched -> ():
  "UNMATCHED" { } 
  ;
%%

use crate::parser::{CSTElement, alloc};

fn flatten<T>(lhs: Result<Vec<T>, ()>, rhs: Result<T, ()>)
           -> Result<Vec<T>, ()>
{
    let mut flt = lhs?;
    flt.push(rhs?);
    Ok(flt)
}
