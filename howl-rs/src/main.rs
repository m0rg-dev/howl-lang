use context::CompilationContext;
use std::error::Error;
use structopt::StructOpt;

use crate::logger::Logger;

#[macro_use(lazy_static)]
extern crate lazy_static;

mod ast;
mod context;
mod cst_import;
mod logger;
mod parser;

#[derive(StructOpt)]
pub struct Cli {
    #[structopt(parse(from_os_str))]
    source_path: std::path::PathBuf,
    #[structopt(short = "m", long = "root-module")]
    root_module: String,
}

fn main() -> Result<(), Box<dyn Error>> {
    let args = Cli::from_args();
    Logger::init(&args);

    let mut context = CompilationContext::new();
    context.compile_from(&args.source_path, &args.root_module)?;

    if context.errors().len() > 0 {
        context.errors().iter().for_each(|x| context.print_error(x));
        eprintln!("Compilation aborted.");
        return Ok(());
    }

    context.link_program();
    if context.errors().len() > 0 {
        context.errors().iter().for_each(|x| context.print_error(x));
        eprintln!("Compilation aborted.");
        return Ok(());
    }

    context.dump();

    Ok(())
}
