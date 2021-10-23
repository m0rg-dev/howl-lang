use lrlex::lrlex_mod;
use std::env;
use std::error::Error;
use std::fs;

mod parser;

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
        eprintln!("{:?}", e);
        eprintln!("{}", e.pp(&lexer, &howl_y::token_epp));
    }

    if !had_errors {
        if let Some(Ok(r)) = res {
            println!("{:#?}", r)
        }
    }

    Ok(())
}
