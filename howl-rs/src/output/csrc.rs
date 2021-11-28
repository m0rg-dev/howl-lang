use crate::{
    ast::{
        generate_unique_name_path,
        types::{get_type_for_expression, type_to_string},
        ASTElement, ASTElementKind, CLASS_FIELD_TYPE, FUNCTION_RETURN, RAW_POINTER_TYPE_INNER,
        TYPE_DEFINITION,
    },
    context::CompilationContext,
    log,
    logger::LogLevel,
    Cli,
};

#[allow(dead_code)]
pub fn output_csrc(ctx: &CompilationContext, _args: &Cli) {
    println!("#include \"runtime.h\"");
    output_forward_declarations(ctx);
    output_structures(ctx);
    output_code(ctx);
    println!("#include \"runtime.c\"");
}

fn output_forward_declarations(ctx: &CompilationContext) {
    ctx.root_module.walk(&|el| {
        match el.element() {
            ASTElementKind::Class { .. } => {
                output_class_forward_declarations(ctx, el);
                // we don't need to recurse into a class
                false
            }
            ASTElementKind::Interface { .. } => {
                output_interface_forward_declarations(ctx, el);
                false
            }
            _ => true,
        }
    });
}

fn output_structures(ctx: &CompilationContext) {
    ctx.root_module.walk(&|el| match el.element() {
        ASTElementKind::Class { generic_order, .. } => {
            if generic_order.len() > 0 {
                return false;
            }

            let path = el.path();
            let name = generate_unique_name_path(&path);
            println!("// begin structures for class {}", path);
            println!("struct {}_stable_t {{", name);
            println!("  char *__typename;");
            println!("  struct stable_common *parent;");

            el.slots_normal()
                .into_iter()
                .for_each(|(_, method)| match method.element() {
                    ASTElementKind::Function {
                        unique_name,
                        argument_order,
                        ..
                    } => {
                        let return_type = get_type_for_expression(
                            ctx,
                            method.slot(FUNCTION_RETURN).unwrap(),
                            false,
                        )
                        .unwrap();
                        println!(
                            "  {}(*{})({});",
                            type_to_c(ctx, return_type),
                            unique_name,
                            argument_order
                                .into_iter()
                                .map(|x| type_to_c(
                                    ctx,
                                    get_type_for_expression(ctx, method.slot(&x).unwrap(), false)
                                        .unwrap()
                                ))
                                .collect::<Vec<String>>()
                                .join(", ")
                        );
                    }
                    _ => {}
                });

            println!("}};");
            println!("typedef struct {}_stable_t *{}_stable;\n", name, name);

            // interface tables
            el.slot_vec().into_iter().for_each(|candidate| {
                let interface = get_type_for_expression(ctx, candidate, false).unwrap();
                match interface.element() {
                    ASTElementKind::Interface { .. } => {
                        println!(
                            "struct {}_itable_t {}_{}_itable;",
                            generate_unique_name_path(&interface.path()),
                            generate_unique_name_path(&interface.path()),
                            name
                        );
                    }
                    _ => {}
                }
            });

            // class object
            println!("struct {}_t {{", name);
            el.slots_normal()
                .into_iter()
                .for_each(|(_, candidate)| match candidate.element() {
                    ASTElementKind::ClassField { name, .. } => {
                        println!(
                            "  {} {};",
                            type_to_c(
                                ctx,
                                get_type_for_expression(
                                    ctx,
                                    candidate.slot(CLASS_FIELD_TYPE).unwrap(),
                                    false
                                )
                                .unwrap()
                            ),
                            name
                        );
                    }
                    _ => {}
                });
            println!("}};");

            // constructor. first, find its arguments
            let temp = el
                .slots()
                .into_iter()
                .filter(|(_, candidate)| {
                    if let ASTElementKind::Function { name, .. } = candidate.element() {
                        name == "constructor"
                    } else {
                        false
                    }
                })
                .map(|(_, candidate)| candidate)
                .collect::<Vec<ASTElement>>();
            let real_constructor = temp.first();
            if let Some(constructor_element) = real_constructor {
                if let ASTElementKind::Function { argument_order, .. } =
                    constructor_element.element()
                {
                    // strip self on _alloc. we'll pass it to constructor() internally later
                    let argument_order = argument_order.clone().drain(1..).collect::<Vec<String>>();
                    println!(
                        "{} {}_alloc({});",
                        name,
                        name,
                        argument_order
                            .into_iter()
                            .map(|x| format!(
                                "{} {}",
                                get_type_for_expression(
                                    ctx,
                                    constructor_element.slot(&x).unwrap(),
                                    false
                                )
                                .map_or("void".to_string(), |x| type_to_c(ctx, x)),
                                x
                            ))
                            .collect::<Vec<String>>()
                            .join(", ")
                    );
                } else {
                    // TODO this is actually an error
                    panic!(
                        "non-function constructor {:?}",
                        constructor_element.element()
                    );
                }
            } else {
                println!("{} {}_alloc();", name, name);
            }

            // class methods (including constructor())
            el.slots_normal().into_iter().for_each(|(_, method)| {
                if let ASTElementKind::Function { argument_order, .. } = method.element() {
                    println!(
                        "{} {}({});",
                        get_type_for_expression(ctx, method.slot(FUNCTION_RETURN).unwrap(), false)
                            .map_or("void".to_string(), |x| type_to_c(ctx, x)),
                        generate_unique_name_path(&method.path()),
                        argument_order
                            .into_iter()
                            .map(|x| format!(
                                "{} {}",
                                get_type_for_expression(ctx, method.slot(&x).unwrap(), false)
                                    .map_or("void".to_string(), |x| type_to_c(ctx, x)),
                                x
                            ))
                            .collect::<Vec<String>>()
                            .join(", ")
                    );
                }
            });

            println!("// end structures for class {}\n", path);
            false
        }
        ASTElementKind::Interface { .. } => {
            let path = el.path();
            let name = generate_unique_name_path(&path);
            println!("// begin structures for interface {}", path);
            println!("struct {}_itable_t {{", name);

            el.slots_normal()
                .into_iter()
                .for_each(|(_, method)| match method.element() {
                    ASTElementKind::Function {
                        unique_name,
                        argument_order,
                        ..
                    } => {
                        let return_type = get_type_for_expression(
                            ctx,
                            method.slot(FUNCTION_RETURN).unwrap(),
                            false,
                        )
                        .unwrap();
                        println!(
                            "  {}(*{})({});",
                            type_to_c(ctx, return_type),
                            unique_name,
                            argument_order
                                .into_iter()
                                .map(|x| type_to_c(
                                    ctx,
                                    get_type_for_expression(ctx, method.slot(&x).unwrap(), false)
                                        .unwrap()
                                ))
                                .collect::<Vec<String>>()
                                .join(", ")
                        );
                    }
                    _ => {}
                });

            println!("}};");
            println!("// end structures for interface {}\n", path);
            false
        }
        _ => true,
    });
}

fn output_class_forward_declarations(ctx: &CompilationContext, el: ASTElement) {
    match el.element() {
        ASTElementKind::Class { generic_order, .. } => {
            if generic_order.len() > 0 {
                return;
            }

            let path = el.path();
            let name = generate_unique_name_path(&path);
            println!("// forward declarations for class {}", path);

            println!("struct {}_t;", name);
            println!(
                "typedef struct {{ struct {}_t *obj; struct {}_stable_t *stable; }} {};",
                name, name, name
            );

            println!("// end forward declarations for class {}\n", path);
        }
        _ => panic!(),
    }
}

fn output_interface_forward_declarations(_ctx: &CompilationContext, el: ASTElement) {
    match el.element() {
        ASTElementKind::Interface { .. } => {
            let path = el.path();
            let name = generate_unique_name_path(&path);
            println!("// forward declarations for interface {}", path);

            println!("struct {}_t;", name);
            println!(
                "typedef struct {{ struct {}_t *obj; struct {}_itable_t *stable; }} {};",
                name, name, name
            );

            println!("// end forward declarations for interface {}\n", path);
        }
        _ => panic!(),
    }
}

fn output_code(ctx: &CompilationContext) {
    ctx.root_module.walk(&|el| match el.element() {
        ASTElementKind::Class { generic_order, .. } => {
            if generic_order.len() > 0 {
                return false;
            }

            let path = el.path();
            let name = generate_unique_name_path(&path);

            println!("// Class: {}", path);
            println!("struct {}_stable_t {}_stable_obj = {{", name, name);
            println!("  \"{}\",", name);
            println!("}};");

            println!("");
            false
        }
        _ => true,
    });
}

pub fn type_to_c(ctx: &CompilationContext, source: ASTElement) -> String {
    log!(
        LogLevel::Trace,
        "type_to_c {} {}",
        type_to_string(source.clone()),
        source.path()
    );
    match source.element() {
        ASTElementKind::Class { .. } => generate_unique_name_path(&source.path()),
        ASTElementKind::Interface { .. } => generate_unique_name_path(&source.path()),
        ASTElementKind::Function { argument_order, .. } => format!(
            "{} {}({});",
            get_type_for_expression(ctx, source.slot(FUNCTION_RETURN).unwrap(), false)
                .map_or("void".to_string(), |x| type_to_c(ctx, x)),
            generate_unique_name_path(&source.path()),
            argument_order
                .into_iter()
                .map(|x| format!(
                    "{} {}",
                    get_type_for_expression(ctx, source.slot(&x).unwrap(), false)
                        .map_or("void".to_string(), |x| type_to_c(ctx, x)),
                    x
                ))
                .collect::<Vec<String>>()
                .join(", ")
        ),
        ASTElementKind::NewType { .. } => {
            get_type_for_expression(ctx, source.slot(TYPE_DEFINITION).unwrap(), false)
                .map_or("void".to_string(), |x| type_to_c(ctx, x))
        }
        ASTElementKind::UnresolvedMethod { .. } => format!("<unresolved method>"),
        ASTElementKind::RawPointerType { .. } => {
            format!(
                "{}*",
                type_to_c(ctx, source.slot(RAW_POINTER_TYPE_INNER).unwrap())
            )
        }
        // at this point the only NamedTypes should be base
        ASTElementKind::NamedType { abspath, .. } => abspath,
        _ => unimplemented!("type_to_c {}", type_to_string(source)),
    }
}
