use crate::{
    ast::ASTElement,
    compilation_unit::CompilationUnit,
    logger::{LogLevel, Logger},
    transform::map_ast,
};

pub fn qualify_items(source: ASTElement, root_module: String, cu: &CompilationUnit) -> ASTElement {
    match source {
        ASTElement::Class(c) => {
            let new_name = format!("{}.{}", root_module, c.name());
            Logger::log(
                LogLevel::Trace,
                &format!("Qualified class:     {}", new_name),
            );
            let new_element = c.with_name(new_name.clone());
            map_ast(ASTElement::Class(new_element), |e| {
                qualify_items(e, new_name.clone(), cu)
            })
        }
        // ASTElement::Function(f) => {
        //     let new_name = format!("{}.{}", root_module, f.name());
        //     Logger::log(
        //         LogLevel::Trace,
        //         &format!("Qualified function:  {}", new_name),
        //     );
        //     ASTElement::Function(f.with_name(new_name))
        // }
        ASTElement::Interface(i) => {
            let new_name = format!("{}.{}", root_module, i.name());
            Logger::log(
                LogLevel::Trace,
                &format!("Qualified interface: {}", new_name),
            );
            let new_element = i.with_name(new_name.clone());
            map_ast(ASTElement::Interface(new_element), |e| {
                qualify_items(e, new_name.clone(), cu)
            })
        }
        // this transform does not recurse by default on purpose
        _ => source,
    }
}
