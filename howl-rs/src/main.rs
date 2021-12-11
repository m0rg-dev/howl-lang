use lrlex::{lrlex_mod, LRNonStreamingLexer};
use lrpar::{LexParseError, NonStreamingLexer, ParseRepair};
use std::{error::Error, fmt::Display, fs};
use structopt::StructOpt;

mod parser;

lrlex_mod!("howl.l");
lrlex_mod!("howl.y");

#[derive(StructOpt)]
pub struct Cli {
    #[structopt(parse(from_os_str))]
    source_path: std::path::PathBuf,
}

#[derive(Debug)]
struct ParseError();

impl ParseError {
    fn new() -> ParseError {
        ParseError()
    }
}

impl Display for ParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Parse failed.")
    }
}

impl Error for ParseError {
    fn description(&self) -> &str {
        "Parse failed."
    }
}

fn main() -> Result<(), Box<dyn Error>> {
    let args = Cli::from_args();

    let src = fs::read_to_string(&args.source_path)?;

    let lexerdef = howl_l::lexerdef();
    let lexer = lexerdef.lexer(&src);
    let (cst, parse_errors) = howl_y::parse(&lexer);

    if parse_errors.len() > 0 {
        parse_errors
            .iter()
            .for_each(|e| print_error(&lexer, e, &args.source_path.to_string_lossy()));
        return Err(Box::new(ParseError::new()));
    }

    if let Some(Ok(cst)) = cst {
        println!("{}", serde_json::to_string(&cst)?);
    }
    Ok(())
}

pub fn print_error(lexer: &LRNonStreamingLexer<u32>, e: &LexParseError<u32>, path: &str) {
    let (span, description) = match e {
        LexParseError::LexError(e) => (e.span(), "Invalid token"),
        LexParseError::ParseError(e) => (e.lexeme().span(), "Syntax error"),
    };

    let ((start_line, start_col), (end_line, end_col)) = lexer.line_col(span);
    eprintln!(
        "\x1b[1;31merror\x1b[0m: {} {}:{}: {}",
        path, start_line, start_col, description
    );

    let lines_str = lexer.span_lines_str(span);
    if start_line == end_line {
        eprintln!("    \x1b[32m{:>5}\x1b[0m {}", start_line, lines_str);
        eprintln!(
            "         {}\x1b[1;35m{}\x1b[0m",
            " ".repeat(start_col),
            "^".repeat(end_col - start_col)
        );
    } else {
        let lines_vec = lines_str.split("\n").collect::<Vec<&str>>();
        let (first_line, rest) = lines_vec.split_first().unwrap();
        let (last_line, rest) = rest.split_last().unwrap();

        let (first_line_before, first_line_after) = first_line.split_at(start_col - 1);
        let (last_line_before, last_line_after) = last_line.split_at(end_col - 1);

        eprintln!(
            "    \x1b[32m{:>5}\x1b[0m {}\x1b[31m{}\x1b[0m",
            start_line, first_line_before, first_line_after
        );
        rest.iter().enumerate().for_each(|(offset, line)| {
            eprintln!(
                "    \x1b[32m{:>5}\x1b[0m \x1b[31m{}\x1b[0m",
                start_line + offset + 1,
                line
            )
        });
        eprintln!(
            "    \x1b[32m{:>5}\x1b[0m \x1b[31m{}\x1b[0m{}",
            end_line, last_line_before, last_line_after
        );
    }

    if let LexParseError::ParseError(e) = e {
        eprintln!("  Possible solutions:");
        e.repairs().iter().for_each(|repair| {
            eprint!("         {}", " ".repeat(start_col));
            repair.iter().for_each(|op| match op {
                ParseRepair::Insert(tidx) => {
                    eprint!("\x1b[1;32m{}\x1b[0m ", howl_y::token_epp(*tidx).unwrap())
                }
                ParseRepair::Shift(lexeme) => {
                    eprint!("{} ", lexer.span_str(lexeme.span()));
                }
                ParseRepair::Delete(lexeme) => {
                    eprint!("\x1b[1;31m{}\x1b[0m ", lexer.span_str(lexeme.span()));
                }
            });
            eprintln!();
        });
    }
}
