use compilation_unit::CompilationUnit;
use std::env;
use std::error::Error;

mod ast;
mod compilation_unit;
mod parser;
mod transform;

fn main() -> Result<(), Box<dyn Error>> {
    let args: Vec<String> = env::args().collect();
    let cu = CompilationUnit::compile_from(&args[1].clone().into())?;
    dbg!(&cu);

    Ok(())
}
