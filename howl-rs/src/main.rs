use cfgrammar::TIdx;
use lrlex::{lrlex_mod, LRNonStreamingLexer};
use lrpar::{LexParseError, NonStreamingLexer, ParseError, ParseRepair, Span};
use std::convert::TryInto;
use std::env;
use std::error::Error;
use std::fs;
use std::hash::Hash;
use std::iter;

use crate::{
    ast::{ASTElement, CSTMismatchError},
    transform::test_transform,
};

mod ast;
mod parser;
mod transform;

lrlex_mod!("howl.l");
lrlex_mod!("howl.y");

fn main() -> Result<(), Box<dyn Error>> {
    let args: Vec<String> = env::args().collect();

    let lexerdef = howl_l::lexerdef();

    let src = fs::read_to_string(&args[1])?;
    let lexer = lexerdef.lexer(&src);
    let (res, errs) = howl_y::parse(&lexer);

    let had_errors = errs.len() > 0;

    for e in errs {
        match e {
            LexParseError::LexError(e) => {
                let ((line, col), _) = lexer.line_col(e.span());
                eprintln!("Lexing error at line {} column {}.", line, col);
                let line_str = lexer.span_lines_str(e.span()).split("\n").next().unwrap();
                eprintln!("    \x1b[32m{:>5}\x1b[0m \x1b[97m{}\x1b[0m", line, line_str);
                eprintln!("         {}\x1b[1;35m^ here\x1b[0m", " ".repeat(col));
            }
            LexParseError::ParseError(e) => {
                print_recovery(&lexer, e);
            }
        }
    }

    if !had_errors {
        if let Some(Ok(r)) = res {
            // println!("{:#?}", r);
            r.iter().for_each(|e| {
                let maybe_ast_el: Result<ASTElement, CSTMismatchError> = e.to_owned().try_into();
                match maybe_ast_el {
                    Ok(_) => println!("{}\n", test_transform(maybe_ast_el.unwrap())),
                    Err(what) => {
                        println!("{:?}", what)
                    }
                }
            });
        }
    }

    Ok(())
}

fn print_recovery(lexer: &LRNonStreamingLexer<u32>, error: ParseError<u32>) {
    let ((line, col), _) = lexer.line_col(error.lexeme().span());
    eprintln!("Parsing error at line {} column {}:", line, col);
    let line_str = lexer
        .span_lines_str(error.lexeme().span())
        .split("\n")
        .next()
        .unwrap();
    eprintln!("    \x1b[32m{:>5}\x1b[0m \x1b[97m{}\x1b[0m", line, line_str);
    if error.repairs().len() > 0 {
        eprintln!("  Possible resolutions:");
        error
            .repairs()
            .iter()
            .for_each(|r| print_repair(lexer, r, line_str, col));
    } else {
        eprintln!(
            "         {}\x1b[1;35m^ parsing stopped here\x1b[0m",
            " ".repeat(col)
        );
        eprintln!("No potential repairs were identified.");
    }

    eprintln!("");
}

fn print_repair(
    lexer: &LRNonStreamingLexer<u32>,
    repair: &Vec<ParseRepair<u32>>,
    line: &str,
    start_col: usize,
) {
    let v: Vec<SpanBasedRepair<u32>> = Vec::new();
    let combined = repair.iter().fold(v, |a, b| match b {
        ParseRepair::Insert(_) => a
            .into_iter()
            .chain(iter::once(SpanBasedRepair::from(b.to_owned())))
            .collect(),
        ParseRepair::Delete(span_rhs) => {
            let length = a.len();
            let it = (&a).into_iter().cloned();
            let it2 = (&a).into_iter();
            match it2.last() {
                Some(&SpanBasedRepair::Delete(span_lhs)) => it
                    .take(length - 1)
                    .chain(iter::once(SpanBasedRepair::Delete(combine_spans(
                        &span_lhs,
                        &span_rhs.span(),
                    ))))
                    .collect(),
                Some(_) => it
                    .chain(iter::once(SpanBasedRepair::from(b.to_owned())))
                    .collect(),
                None => vec![SpanBasedRepair::from(b.to_owned())],
            }
        }
        ParseRepair::Shift(span_rhs) => {
            let length = a.len();
            let it = (&a).into_iter().cloned();
            let it2 = (&a).into_iter();
            match it2.last() {
                Some(&SpanBasedRepair::Shift(span_lhs)) => it
                    .take(length - 1)
                    .chain(iter::once(SpanBasedRepair::Shift(combine_spans(
                        &span_lhs,
                        &span_rhs.span(),
                    ))))
                    .collect(),
                Some(_) => it
                    .chain(iter::once(SpanBasedRepair::from(b.to_owned())))
                    .collect(),
                None => vec![SpanBasedRepair::from(b.to_owned())],
            }
        }
    });
    eprint!("          {}", &line[0..start_col - 1]);
    let mut end_col = start_col;
    let mut inserted_length = 0;
    combined.iter().for_each(|op| match op {
        SpanBasedRepair::Insert(tidx) => {
            eprint!("\x1b[1;36m{}\x1b[0m ", howl_y::token_epp(*tidx).unwrap());
            inserted_length += howl_y::token_epp(*tidx).unwrap().len() + 1;
        }
        SpanBasedRepair::Delete(span) => {
            eprint!("\x1b[31m{}\x1b[0m", lexer.span_str(*span));
            end_col += span.len();
        }
        SpanBasedRepair::Shift(span) => {
            eprint!("\x1b[97m{}\x1b[0m", lexer.span_str(*span));
            end_col += span.len();
        }
    });
    if end_col < line.len() {
        eprint!("{}", &line[end_col - 1..]);
    }
    eprintln!(
        "\n         {}\x1b[1;34m{}\x1b[0m",
        " ".repeat(start_col),
        "^".repeat(end_col - start_col + inserted_length)
    );
}

fn combine_spans(lhs: &Span, rhs: &Span) -> Span {
    return Span::new(lhs.start(), rhs.end());
}

#[derive(Debug, Clone)]
enum SpanBasedRepair<StorageT> {
    Insert(TIdx<StorageT>),
    Delete(Span),
    Shift(Span),
}

impl<T: Hash + Copy> SpanBasedRepair<T> {
    fn from(src: ParseRepair<T>) -> SpanBasedRepair<T> {
        match src {
            ParseRepair::Insert(token) => SpanBasedRepair::Insert(token),
            ParseRepair::Delete(lexeme) => SpanBasedRepair::Delete(lexeme.span()),
            ParseRepair::Shift(lexeme) => SpanBasedRepair::Shift(lexeme.span()),
        }
    }
}
