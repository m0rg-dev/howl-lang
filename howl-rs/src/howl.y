%start Program
%%
Program -> Result<CSTElement, ()>:
    ClassHeader ClassBody {
        Ok(CSTElement::Class{ span: $span, header: Box::new($1?), body: Box::new($2?) })
    }
    ;

ClassHeader -> Result<CSTElement, ()>:
    'CLASS' Identifier GenericList {
        Ok(CSTElement::ClassHeader{ span: $span, name: Box::new($2?), generics: Some(Box::new($3?)) })
    }
    | 'CLASS' Identifier {
        Ok(CSTElement::ClassHeader{ span: $span, name: Box::new($2?), generics: None})
    }
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

Function -> Result<CSTElement, ()>:
    'FN' Type Identifier TypedArgumentList CompoundStatement { 
        Ok(CSTElement::Function{
            span: $span,
            returntype: Box::new($2?),
            name: Box::new($3?),
            args: Box::new($4?),
            body: Box::new($5?)
        })
    }
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

IfStatement -> Result<CSTElement, ()>:
    'IF' Expression CompoundStatement { Ok(CSTElement::IfStatement{span: $span, condition: Box::new($2?), body: Box::new($3?) }) }
    ;

ElseIfStatement -> Result<CSTElement, ()>:
    'ELSE' 'IF' Expression CompoundStatement { Ok(CSTElement::ElseIfStatement{span: $span, condition: Box::new($3?), body: Box::new($4?) }) }
    ;

ElseStatement -> Result<CSTElement, ()>:
    'ELSE' CompoundStatement { Ok(CSTElement::ElseStatement{span: $span, body: Box::new($2?) }) }
    ;

Expression -> Result<CSTElement, ()>:
    Expression '>' '=' Expression1 {
        Ok(CSTElement::ArithmeticExpression{span: $span, operator: ">=".to_string(), lhs: Box::new($1?), rhs: Box::new($4?)})
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
    | Expression3 { $1 }
    ;

Expression3 -> Result<CSTElement, ()>:
    '(' Expression ')' { $2 }
    | 'identifier' { 
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
    | "FFICALL" 'identifier' ArgumentList {
        match $2 {
            Ok(_) => Ok(CSTElement::FFICallExpression{span: $span, name: $lexer.span_str($2.as_ref().unwrap().span()).to_string(), args: Box::new($3?)}),
            Err(_) => Err(())
        }
    }
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
    'identifier' { 
        match $1 {
            Ok(_) => Ok(CSTElement::BaseType{span: $span, name: $lexer.span_str($1.as_ref().unwrap().span()).to_string()}),
            Err(_) => Err(())
        }
    }
    | '*' Type { Ok(CSTElement::RawPointerType{span: $span, inner: Box::new($2?)}) }
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
