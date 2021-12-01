use std::{error::Error, path::Path, rc::Rc};

use inkwell::{
    basic_block::BasicBlock,
    context::Context,
    module::Module,
    types::{BasicMetadataTypeEnum, BasicType, BasicTypeEnum, FunctionType, StructType},
    values::FunctionValue,
    AddressSpace,
};

use crate::{
    ast::{
        generate_unique_name_path,
        types::{get_type_for_expression, type_to_string},
        ASTElement, ASTElementKind, CLASS_FIELD_TYPE, FUNCTION_BODY, FUNCTION_RETURN,
        RAW_POINTER_TYPE_INNER, TYPE_DEFINITION,
    },
    context::CompilationContext,
    log,
    logger::LogLevel,
    Cli,
};

#[allow(dead_code)]
pub fn output_llvm(ctx: &CompilationContext, _args: &Cli) {
    let inkwell_ctx = Context::create();
    ctx.root_module.walk(&|el| match el.element() {
        ASTElementKind::Module { .. } => {
            output_module(ctx, &inkwell_ctx, el).unwrap();
            true
        }
        _ => true,
    });
}

fn output_module(
    ctx: &CompilationContext,
    inkwell_ctx: &Context,
    root: ASTElement,
) -> Result<(), Box<dyn Error>> {
    let module = inkwell_ctx.create_module(&root.path());
    output_functions(ctx, inkwell_ctx, &module, root.clone());
    generate_referenced_classes(ctx, inkwell_ctx, &module, root.clone());
    module.print_to_file(Path::new(
        &("./howl_target/".to_string() + &generate_unique_name_path(&root.path())),
    ))?;
    Ok(())
}

fn output_functions<'ctx>(
    ctx: &CompilationContext,
    inkwell_ctx: &'ctx Context,
    module: &Module<'ctx>,
    root: ASTElement,
) {
    root.walk(&|el| match el.element() {
        ASTElementKind::Module { .. } => el.path() == root.path(),
        ASTElementKind::Class { generic_order, .. } => generic_order.len() == 0,
        ASTElementKind::Function { argument_order, .. } => {
            let path = el.path();
            let rctype = type_to_llvm(ctx, inkwell_ctx, module, el.slot(FUNCTION_RETURN).unwrap());
            let argtypes = argument_order
                .iter()
                .map(|argname| {
                    type_to_llvm(ctx, inkwell_ctx, module, el.slot(argname).unwrap())
                        .unwrap()
                        .as_basic_type_enum()
                        .into()
                })
                .collect::<Vec<BasicMetadataTypeEnum>>();
            let fn_value = if let Some(rctype) = rctype {
                module.add_function(&path, rctype.fn_type(argtypes.as_slice(), false), None)
            } else {
                module.add_function(
                    &path,
                    inkwell_ctx.void_type().fn_type(argtypes.as_slice(), false),
                    None,
                )
            };
            if el.slot(FUNCTION_BODY).is_some() {
                let b = inkwell_ctx.create_builder();
                let entry_block = inkwell_ctx.append_basic_block(fn_value, "entry");
                b.position_at_end(entry_block);
                b.build_unreachable();
                build_function_body(
                    ctx,
                    inkwell_ctx,
                    module,
                    Rc::new(fn_value),
                    el.slot(FUNCTION_BODY).unwrap(),
                );
            }
            false
        }
        _ => true,
    });
}

fn build_function_body<'ctx>(
    ctx: &CompilationContext,
    inkwell_ctx: &'ctx Context,
    module: &Module<'ctx>,
    fn_value: Rc<FunctionValue>,
    block: ASTElement,
) {
    match block.element() {
        ASTElementKind::CompoundStatement { .. } => {
            block.slot_vec().into_iter().for_each(|statement| {
                build_function_body(ctx, inkwell_ctx, module, fn_value.clone(), statement)
            });
        }
        _ => log!(
            LogLevel::Bug,
            "build_function_body todo {:?}",
            block.element()
        ),
    }
}

fn generate_referenced_classes<'ctx>(
    ctx: &CompilationContext,
    inkwell_ctx: &'ctx Context,
    module: &Module<'ctx>,
    root: ASTElement,
) {
    root.walk(
        &|el| match get_type_for_expression(ctx, el, true).map(|x| (x.clone(), x.element())) {
            Some((el, ASTElementKind::Class { generic_order, .. })) => {
                if generic_order.len() > 0 {
                    return false;
                }
                let llvm_type = module
                    .get_struct_type(&el.path())
                    .unwrap_or_else(|| inkwell_ctx.opaque_struct_type(&el.path()));
                if llvm_type.is_opaque() {
                    let mut subtypes = el
                        .slots_normal()
                        .into_iter()
                        .filter(|(_, field)| {
                            matches!(field.element(), ASTElementKind::ClassField { .. })
                        })
                        .map(|(_, field)| {
                            type_to_llvm(
                                ctx,
                                inkwell_ctx,
                                module,
                                get_type_for_expression(
                                    ctx,
                                    field.slot(CLASS_FIELD_TYPE).unwrap(),
                                    false,
                                )
                                .unwrap(),
                            )
                            .unwrap()
                            .as_basic_type_enum()
                        })
                        .collect::<Vec<BasicTypeEnum>>();
                    let mut contents = vec![inkwell_ctx
                        .opaque_struct_type(&("$".to_string() + &el.path()))
                        .ptr_type(AddressSpace::Generic)
                        .as_basic_type_enum()];
                    contents.append(&mut subtypes);
                    llvm_type.set_body(contents.as_slice(), false);
                }

                let llvm_stable_type = module
                    .get_struct_type(&("$".to_string() + &el.path()))
                    .unwrap_or_else(|| {
                        inkwell_ctx.opaque_struct_type(&("$".to_string() + &el.path()))
                    });
                if llvm_stable_type.is_opaque() {
                    let mut methods = el
                        .slots_normal()
                        .into_iter()
                        .filter(|(_, method)| {
                            matches!(method.element(), ASTElementKind::Function { .. })
                        })
                        .map(|(_, method)| {
                            if let ASTElementKind::Function { argument_order, .. } =
                                method.element()
                            {
                                let rctype = type_to_llvm(
                                    ctx,
                                    inkwell_ctx,
                                    module,
                                    method.slot(FUNCTION_RETURN).unwrap(),
                                );
                                let argtypes = argument_order
                                    .iter()
                                    .map(|argname| {
                                        type_to_llvm(
                                            ctx,
                                            inkwell_ctx,
                                            module,
                                            method.slot(argname).unwrap(),
                                        )
                                        .unwrap()
                                        .as_basic_type_enum()
                                        .into()
                                    })
                                    .collect::<Vec<BasicMetadataTypeEnum>>();
                                if let Some(rctype) = rctype {
                                    rctype
                                        .fn_type(argtypes.as_slice(), false)
                                        .ptr_type(AddressSpace::Generic)
                                        .as_basic_type_enum()
                                } else {
                                    inkwell_ctx
                                        .void_type()
                                        .fn_type(argtypes.as_slice(), false)
                                        .ptr_type(AddressSpace::Generic)
                                        .as_basic_type_enum()
                                }
                            } else {
                                unreachable!()
                            }
                        })
                        .collect::<Vec<BasicTypeEnum>>();
                    let mut contents = vec![inkwell_ctx
                        .i8_type()
                        .ptr_type(AddressSpace::Generic)
                        .as_basic_type_enum()];
                    contents.append(&mut methods);
                    llvm_stable_type.set_body(contents.as_slice(), true);
                }

                true
            }
            _ => true,
        },
    )
}

fn type_to_llvm<'ctx>(
    ctx: &CompilationContext,
    inkwell_ctx: &'ctx Context,
    module: &Module<'ctx>,
    source: ASTElement,
) -> Option<Box<dyn BasicType<'ctx> + 'ctx>> {
    match source.element() {
        ASTElementKind::Class { .. } => {
            let path = source.path();
            Some(Box::new(
                inkwell_ctx.struct_type(
                    &[
                        module
                            .get_struct_type(&path)
                            .unwrap_or_else(|| inkwell_ctx.opaque_struct_type(&path))
                            .ptr_type(AddressSpace::Generic)
                            .into(),
                        module
                            .get_struct_type(&("$".to_string() + &path))
                            .unwrap_or_else(|| {
                                inkwell_ctx.opaque_struct_type(&("$".to_string() + &path))
                            })
                            .ptr_type(AddressSpace::Generic)
                            .into(),
                    ],
                    true,
                ),
            ))
        }
        ASTElementKind::Interface { .. } => {
            let path = source.path();
            Some(Box::new(
                inkwell_ctx.struct_type(
                    &[
                        module
                            .get_struct_type(&path)
                            .unwrap_or_else(|| inkwell_ctx.opaque_struct_type(&path))
                            .ptr_type(AddressSpace::Generic)
                            .into(),
                        module
                            .get_struct_type(&("$".to_string() + &path))
                            .unwrap_or_else(|| {
                                inkwell_ctx.opaque_struct_type(&("$".to_string() + &path))
                            })
                            .ptr_type(AddressSpace::Generic)
                            .into(),
                    ],
                    true,
                ),
            ))
        }
        ASTElementKind::RawPointerType { .. } => Some(Box::new(
            type_to_llvm(
                ctx,
                inkwell_ctx,
                module,
                source.slot(RAW_POINTER_TYPE_INNER).unwrap(),
            )
            .unwrap()
            .ptr_type(AddressSpace::Generic),
        )),
        ASTElementKind::NewType { .. } => source
            .slot(TYPE_DEFINITION)
            .map(|source| type_to_llvm(ctx, inkwell_ctx, module, source))
            .flatten(),
        ASTElementKind::NamedType { abspath, .. } => match abspath.as_str() {
            "i8" => Some(Box::new(inkwell_ctx.i8_type())),
            "i16" => Some(Box::new(inkwell_ctx.i16_type())),
            "i32" => Some(Box::new(inkwell_ctx.i32_type())),
            "i64" => Some(Box::new(inkwell_ctx.i64_type())),
            "u8" => Some(Box::new(inkwell_ctx.i8_type())),
            "u16" => Some(Box::new(inkwell_ctx.i16_type())),
            "u32" => Some(Box::new(inkwell_ctx.i32_type())),
            "u64" => Some(Box::new(inkwell_ctx.i64_type())),
            "bool" => Some(Box::new(inkwell_ctx.bool_type())),
            // yep this is the only way you get None out of here
            "void" => None,
            _ => {
                let refer = ctx.path_get(&source, &abspath);
                if let Some(refer) = refer {
                    type_to_llvm(ctx, inkwell_ctx, module, refer)
                } else {
                    log!(LogLevel::Bug, "no type for {}?", abspath);
                    Some(Box::new(inkwell_ctx.struct_type(&[], false)))
                }
            }
        },
        _ => {
            log!(
                LogLevel::Bug,
                "type_to_llvm unimplemented {}",
                type_to_string(source)
            );
            Some(Box::new(inkwell_ctx.struct_type(&[], false)))
        }
    }
}
