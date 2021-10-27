use context::Context;
use std::error::Error;
use structopt::StructOpt;

use crate::logger::Logger;

#[macro_use(lazy_static)]
extern crate lazy_static;

mod ast;
mod compilation_unit;
mod context;
mod logger;
mod parser;
mod transform;

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

    let mut context = Context::new();
    context.ingest_file(&args.source_path, args.root_module)?;
    context.compile_whole_program();

    Ok(())
}
