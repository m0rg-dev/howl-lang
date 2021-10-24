%start Program
%avoid_insert "CLASS"
%avoid_insert "INTERFACE"
%%
Program -> Result<Vec<CSTElement>, ()>:
    ProgramElement { Ok(vec![$1?]) }
    | Program ProgramElement { flatten($1, $2) }
    ;

ProgramElement -> Result<CSTElement, ()>:
    ClassHeader ClassBody {
        Ok(CSTElement::Class{ span: $span, header: Box::new($1?), body: Box::new($2?) })
    }
    | InterfaceHeader InterfaceBody {
        Ok(CSTElement::Interface{ span: $span, header: Box::new($1?), body: Box::new($2?) })
    }
    | Function {
        Ok($1?)
    }
    ;

ClassHeader -> Result<CSTElement, ()>:
    ClassNameAndGenerics 'EXTENDS' Identifier ImplementsList {
        match $3 {
            Ok(_) => {
                let inner = $1?;
                Ok(CSTElement::ClassHeader{ span: $span, name: inner.0, generics: inner.1, extends: Some(Box::new($3?)), implements: $4? })
            }
            Err(_) => Err(())
        }
    }
    | ClassNameAndGenerics ImplementsList {
        let inner = $1?;
        Ok(CSTElement::ClassHeader{ span: $span, name: inner.0, generics: inner.1, extends: None, implements: $2? })
    }
    ;

ClassNameAndGenerics -> Result<(Box<CSTElement>, Option<Box<CSTElement>>), ()>:
    'CLASS' Identifier GenericList {
        Ok((Box::new($2?), Some(Box::new($3?))))
    }
    | 'CLASS' Identifier {
        Ok((Box::new($2?), None))
    }
    ;

ImplementsList -> Result<Vec<CSTElement>, ()>:
    /* empty */ { Ok(vec![]) }
    | 'IMPLEMENTS' Type { Ok(vec![$2?]) }
    | ImplementsList ',' Type { flatten($1, $3) }
    ;

ClassField -> Result<CSTElement, ()>:
    Type Identifier ';' {
        Ok(CSTElement::ClassField{ span: $span, fieldtype: Box::new($1?), fieldname: Box::new($2?) })
    }
    ;

ClassBody -> Result<CSTElement, ()>:
    '{' '}' { Ok(CSTElement::ClassBody{ span: $span, elements: vec![] }) }
    | '{' ClassBodyInner '}' { Ok(CSTElement::ClassBody{ span: $span, elements: $2? }) }
    ;

ClassBodyInner -> Result<Vec<CSTElement>, ()>:
    ClassField { Ok(vec![$1?]) }
    | Function { Ok(vec![$1?]) }
    | ClassBodyInner ClassField { flatten($1, $2) }
    | ClassBodyInner Function { flatten($1, $2) }
    ;

InterfaceHeader -> Result<CSTElement, ()>:
    'INTERFACE' Identifier GenericList {
        Ok(CSTElement::InterfaceHeader{ span: $span, name: Box::new($2?), generics: Some(Box::new($3?)) })
    }
    | 'INTERFACE' Identifier {
        Ok(CSTElement::InterfaceHeader{ span: $span, name: Box::new($2?), generics: None})
    }
    ;


InterfaceBody -> Result<CSTElement, ()>:
    '{' '}' { Ok(CSTElement::InterfaceBody{ span: $span, elements: vec![] }) }
    | '{' InterfaceBodyInner '}' { Ok(CSTElement::InterfaceBody{ span: $span, elements: $2? }) }
    ;

InterfaceBodyInner -> Result<Vec<CSTElement>, ()>:
    FunctionHeader ';' { Ok(vec![$1?]) }
    | InterfaceBodyInner FunctionHeader ';' { flatten($1, $2) }
    ;

Function -> Result<CSTElement, ()>:
    FunctionHeader CompoundStatement {
        Ok(CSTElement::Function{ span: $span, header: Box::new($1?), body: Box::new($2?) })
    }
    ;

FunctionHeader -> Result<CSTElement, ()>:
    'STATIC' 'FN' Type Identifier TypedArgumentList ThrowsList { 
        Ok(CSTElement::FunctionDeclaration{
            span: $span,
            is_static: true,
            returntype: Box::new($3?),
            name: Box::new($4?),
            args: Box::new($5?),
            throws: $6?
        })
    }
    | 'FN' Type Identifier TypedArgumentList ThrowsList { 
        Ok(CSTElement::FunctionDeclaration{
            span: $span,
            is_static: false,
            returntype: Box::new($2?),
            name: Box::new($3?),
            args: Box::new($4?),
            throws: $5?
        })
    }
    ;

ThrowsList -> Result<Vec<CSTElement>, ()>:
    /* empty */ { Ok(vec![]) }
    | 'THROWS' Type { Ok(vec![$2?]) }
    | ThrowsList ',' Type { flatten($1, $3) }
    ;

TypedArgumentList -> Result<CSTElement, ()>:
    '(' ')' { Ok(CSTElement::TypedArgumentList{ span: $span, args: vec![] }) }
    | '(' TypedArgumentListInner ')' { Ok(CSTElement::TypedArgumentList{span: $span, args: $2? }) }
    ;

TypedArgumentListInner -> Result<Vec<CSTElement>, ()>:
    TypedArgument { Ok(vec![$1?]) }
    | TypedArgumentListInner ',' TypedArgument { flatten($1, $3) }
    ;

TypedArgument -> Result<CSTElement, ()>:
    Type Identifier { Ok(CSTElement::TypedArgument{span: $span, argtype: Box::new($1?), argname: Box::new($2?) }) }
    ;

CompoundStatement -> Result<CSTElement, ()>:
    '{' '}' { Ok(CSTElement::CompoundStatement{ span: $span, statements: vec![] }) }
    | '{' CompoundStatementInner '}' { Ok(CSTElement::CompoundStatement{ span: $span, statements: $2? }) }
    ;

CompoundStatementInner -> Result<Vec<CSTElement>, ()>:
    Statement { Ok(vec![$1?]) }
    | CompoundStatementInner Statement { flatten($1, $2) }
    ;

Statement -> Result<CSTElement, ()>:
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
    | 'linecomment' {
        match $1 {
            Ok(_) => Ok(CSTElement::Comment{span: $span, as_text: $lexer.span_str($1.as_ref().unwrap().span()).to_string()}),
            Err(_) => Err(())
        }
    }
    ;

SimpleStatement -> Result<CSTElement, ()>:
    Expression ';' { Ok(CSTElement::SimpleStatement{ span: $span, expression: Box::new($1?) }) }
    ;

AssignmentStatement -> Result<CSTElement, ()>:
    Expression '=' Expression ';' { Ok(CSTElement::AssignmentStatement{ span: $span, lhs: Box::new($1?), rhs: Box::new($3?) }) }
    ;

ReturnStatement -> Result<CSTElement, ()>:
    'RETURN' Expression ';' { Ok(CSTElement::ReturnStatement{ span: $span, source: Some(Box::new($2?)) }) }
    | 'RETURN' ';' { Ok(CSTElement::ReturnStatement{ span: $span, source: None }) }
    ;

ThrowStatement -> Result<CSTElement, ()>:
    'THROW' Expression ';' { Ok(CSTElement::ThrowStatement{ span: $span, source: Box::new($2?) }) }
    ;

TryStatement -> Result<CSTElement, ()>:
    'TRY' CompoundStatement { Ok(CSTElement::TryStatement{span: $span, body: Box::new($2?) }) }
    ;

CatchStatement -> Result<CSTElement, ()>:
    'CATCH' Type 'identifier' CompoundStatement {
        match $3 {
            Ok(_) => Ok(CSTElement::CatchStatement{
                span: $span,
                exctype: Box::new($2?),
                excname: $lexer.span_str($3.as_ref().unwrap().span()).to_string(),
                body: Box::new($4?)
            }),
            Err(_) => Err(())
        }
    }
    ;

IfStatement -> Result<CSTElement, ()>:
    'IF' Expression CompoundStatement { Ok(CSTElement::IfStatement{span: $span, condition: Box::new($2?), body: Box::new($3?) }) }
    ;

ElseIfStatement -> Result<CSTElement, ()>:
    'ELSE' 'IF' Expression CompoundStatement { Ok(CSTElement::ElseIfStatement{span: $span, condition: Box::new($3?), body: Box::new($4?) }) }
    ;

ElseStatement -> Result<CSTElement, ()>:
    'ELSE' CompoundStatement { Ok(CSTElement::ElseStatement{span: $span, body: Box::new($2?) }) }
    ;

WhileStatement -> Result<CSTElement, ()>:
    'WHILE' Expression CompoundStatement { Ok(CSTElement::WhileStatement{span: $span, condition: Box::new($2?), body: Box::new($3?) }) }
    ;

LocalDefinitionStatement -> Result<CSTElement, ()>:
    'LET' Type 'identifier' '=' Expression ';' {
        match $3 {
            Ok(_) => Ok(CSTElement::LocalDefinitionStatement{
                span: $span,
                localtype: Box::new($2?),
                name: $lexer.span_str($3.as_ref().unwrap().span()).to_string(),
                initializer: Box::new($5?)
            }),
            Err(_) => Err(())
        }
    }
    ;

Expression -> Result<CSTElement, ()>:
    Expression '>' '=' Expression1 {
        Ok(CSTElement::ArithmeticExpression{span: $span, operator: ">=".to_string(), lhs: Box::new($1?), rhs: Box::new($4?)})
    }
    | Expression '>' Expression1 {
        Ok(CSTElement::ArithmeticExpression{span: $span, operator: ">".to_string(), lhs: Box::new($1?), rhs: Box::new($3?)})
    }
    | Expression '=' '=' Expression1 {
        Ok(CSTElement::ArithmeticExpression{span: $span, operator: "==".to_string(), lhs: Box::new($1?), rhs: Box::new($4?)})
    }
    | Expression '!' '=' Expression1 {
        Ok(CSTElement::ArithmeticExpression{span: $span, operator: "!=".to_string(), lhs: Box::new($1?), rhs: Box::new($4?)})
    }
    | Expression '<' Expression1 {
        Ok(CSTElement::ArithmeticExpression{span: $span, operator: "<".to_string(), lhs: Box::new($1?), rhs: Box::new($3?)})
    }
    | Expression '<' '=' Expression1 {
        Ok(CSTElement::ArithmeticExpression{span: $span, operator: "<=".to_string(), lhs: Box::new($1?), rhs: Box::new($4?)})
    }
    | Expression1 { $1 }
    ;

Expression1 -> Result<CSTElement, ()>:
    Expression1 '+' Expression2 {
        Ok(CSTElement::ArithmeticExpression{span: $span, operator: "+".to_string(), lhs: Box::new($1?), rhs: Box::new($3?)})
    }
    | Expression1 '-' Expression2 {
        Ok(CSTElement::ArithmeticExpression{span: $span, operator: "-".to_string(), lhs: Box::new($1?), rhs: Box::new($3?)})
    }
    | Expression2 { $1 }
    ;

Expression2 -> Result<CSTElement, ()>:
    Expression2 '*' Expression3 {
        Ok(CSTElement::ArithmeticExpression{span: $span, operator: "*".to_string(), lhs: Box::new($1?), rhs: Box::new($3?)})
    }
    | Expression2 '/' Expression3 {
        Ok(CSTElement::ArithmeticExpression{span: $span, operator: "/".to_string(), lhs: Box::new($1?), rhs: Box::new($3?)})
    }
    | Expression2 '%' Expression3 {
        Ok(CSTElement::ArithmeticExpression{span: $span, operator: "%".to_string(), lhs: Box::new($1?), rhs: Box::new($3?)})
    }
    | Expression3 { $1 }
    ;

Expression3 -> Result<CSTElement, ()>:
    'identifier' { 
        match $1 {
            Ok(_) => Ok(CSTElement::NameExpression{span: $span, name: $lexer.span_str($1.as_ref().unwrap().span()).to_string()}),
            Err(_) => Err(())
        }
    }
    | 'number' { 
        match $1 {
            Ok(_) => Ok(CSTElement::NumberExpression{span: $span, as_text: $lexer.span_str($1.as_ref().unwrap().span()).to_string()}),
            Err(_) => Err(())
        }
    }
    | 'string' { 
        match $1 {
            Ok(_) => Ok(CSTElement::StringLiteral{span: $span, contents: $lexer.span_str($1.as_ref().unwrap().span()).to_string()}),
            Err(_) => Err(())
        }
    }
    | Expression3 '.' 'identifier' {
        match $3 {
            Ok(_) => Ok(CSTElement::FieldReferenceExpression{span: $span, source: Box::new($1?), name: $lexer.span_str($3.as_ref().unwrap().span()).to_string()}),
            Err(_) => Err(())
        }
    }
    | Expression3 '[' Expression ']' {
        Ok(CSTElement::IndexExpression{span: $span, source: Box::new($1?), index: Box::new($3?)})
    }
    | Expression3 ArgumentList {
        Ok(CSTElement::FunctionCallExpression{span: $span, source: Box::new($1?), args: Box::new($2?)})
    }
    | "NEW" Type ArgumentList {
        Ok(CSTElement::ConstructorCallExpression{span: $span, source: Box::new($2?), args: Box::new($3?)})
    }
    | "FFICALL" 'identifier' ArgumentList {
        match $2 {
            Ok(_) => Ok(CSTElement::FFICallExpression{span: $span, name: $lexer.span_str($2.as_ref().unwrap().span()).to_string(), args: Box::new($3?)}),
            Err(_) => Err(())
        }
    }
    | "!" 'identifier' ArgumentList {
        match $2 {
            Ok(_) => Ok(CSTElement::MacroCallExpression{span: $span, name: $lexer.span_str($2.as_ref().unwrap().span()).to_string(), args: Box::new($3?)}),
            Err(_) => Err(())
        }
    }
    | '(' Expression ')' { $2 }
    ;

ArgumentList -> Result<CSTElement, ()>:
    '(' ')' { Ok(CSTElement::ArgumentList{ span: $span, args: vec![] }) }
    | '(' ArgumentListInner ')' { Ok(CSTElement::ArgumentList{span: $span, args: $2? }) }
    ;

ArgumentListInner -> Result<Vec<CSTElement>, ()>:
    Expression { Ok(vec![$1?]) }
    | ArgumentListInner ',' Expression { flatten($1, $3) }
    ;

Type -> Result<CSTElement, ()>:
    '*' Type1 { Ok(CSTElement::RawPointerType{span: $span, inner: Box::new($2?)}) }
    | Type1 { Ok($1?) }
    ;

Type1 -> Result<CSTElement, ()>:
    '(' Type ')' { Ok($2?) }
    | Type1 TypeParameterList { Ok(CSTElement::SpecifiedType{span: $span, base: Box::new($1?), parameters: Box::new($2?) }) }
    | 'identifier' { 
        match $1 {
            Ok(_) => Ok(CSTElement::BaseType{span: $span, name: $lexer.span_str($1.as_ref().unwrap().span()).to_string()}),
            Err(_) => Err(())
        }
    }
    ;

TypeParameterList -> Result<CSTElement, ()>: 
    '<' TypeParameterListInner '>' { Ok(CSTElement::TypeParameterList{span: $span, parameters: $2? }) }
    ;

TypeParameterListInner -> Result<Vec<CSTElement>, ()>:
    Type { Ok(vec![$1?]) }
    | TypeParameterListInner ',' Type { flatten($1, $3) }
    ;

GenericList -> Result<CSTElement, ()>:
    '<' GenericListInner '>' { Ok(CSTElement::GenericList{span: $span, names: $2? }) }
    ;

GenericListInner -> Result<Vec<CSTElement>, ()>:
    Identifier { Ok(vec![$1?]) }
    | GenericListInner ',' Identifier { flatten($1, $3) }
    ;

Identifier -> Result<CSTElement, ()>:
    'identifier' {
        match $1 {
            Ok(_) => Ok(CSTElement::Identifier{span: $span, name: $lexer.span_str($1.as_ref().unwrap().span()).to_string()}),
            Err(_) => Err(())
        }
    }
    ;

Unmatched -> ():
  "UNMATCHED" { } 
  ;
%%

use crate::parser::CSTElement;

fn flatten<T>(lhs: Result<Vec<T>, ()>, rhs: Result<T, ()>)
           -> Result<Vec<T>, ()>
{
    let mut flt = lhs?;
    flt.push(rhs?);
    Ok(flt)
}
