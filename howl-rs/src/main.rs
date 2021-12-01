//use context::CompilationContext;
//use output::{csrc::output_csrc, graphviz::output_graphviz, llvm::output_llvm};
use lrlex::lrlex_mod;
use std::{error::Error, fs};
use structopt::StructOpt;

use crate::logger::Logger;

#[macro_use(lazy_static)]
extern crate lazy_static;

//mod ast;
//mod context;
//mod cst_import;
mod logger;
//mod output;
mod parser;
//mod transform;

lrlex_mod!("howl.l");
lrlex_mod!("howl.y");

#[derive(StructOpt)]
pub struct Cli {
    #[structopt(parse(from_os_str))]
    source_path: std::path::PathBuf,
    #[structopt(short = "m", long = "root-module")]
    root_module: String,
    #[structopt(long = "graphviz-filter")]
    graphviz_filter: Option<String>,
    #[structopt(short = "S", long = "output-format", default_value = "llvm")]
    output_format: String,
}

fn main() -> Result<(), Box<dyn Error>> {
    let args = Cli::from_args();
    Logger::init(&args);

    let src = fs::read_to_string(&args.source_path)?;

    let lexerdef = howl_l::lexerdef();
    let lexer = lexerdef.lexer(&src);
    let (cst, parse_errors) = howl_y::parse(&lexer);

    if let Some(Ok(cst)) = cst {
        println!("{}", serde_json::to_string_pretty(&cst[0])?);
    }
    /*
        let mut context = CompilationContext::new();
        context.compile_from(&args.source_path, &args.root_module)?;

        let library_paths = std::fs::read_dir("stdlib")?;
        for path in library_paths {
            context.compile_from(&path.unwrap().path(), "lib")?;
        }

        if context.errors().len() > 0 {
            context.errors().iter().for_each(|x| context.print_error(x));
            eprintln!("Compilation aborted.");
            return Ok(());
        }

        context.link_program();
        match args.output_format.as_str() {
            "graphviz" => output_graphviz(&context, &args),
            "llvm" => output_llvm(&context, &args),
            "csrc" => output_csrc(&context, &args),
            _ => {}
        };

        if context.errors().len() > 0 {
            context.errors().iter().for_each(|x| context.print_error(x));
            eprintln!("Compilation aborted.");
            return Ok(());
        }

        // context.dump();
    */
    Ok(())
}
