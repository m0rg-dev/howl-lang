package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.Set;

import dev.m0rg.howl.ast.type.ClassStaticType;
import dev.m0rg.howl.ast.type.ClassType;
import dev.m0rg.howl.ast.type.HasOwnType;
import dev.m0rg.howl.ast.type.InterfaceType;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.NewType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMConstant;
import dev.m0rg.howl.llvm.LLVMFunction;
import dev.m0rg.howl.llvm.LLVMFunctionType;
import dev.m0rg.howl.llvm.LLVMGlobalVariable;
import dev.m0rg.howl.llvm.LLVMIntType;
import dev.m0rg.howl.llvm.LLVMModule;
import dev.m0rg.howl.llvm.LLVMPointerType;
import dev.m0rg.howl.llvm.LLVMStructureType;
import dev.m0rg.howl.llvm.LLVMType;
import dev.m0rg.howl.llvm.LLVMValue;
import dev.m0rg.howl.logger.Logger;

public class Class extends ObjectCommon implements HasOwnType, GeneratesTopLevelItems {
    List<TypeElement> impl;

    LLVMFunction allocator;

    public Class(Span span, String name, List<String> generics) {
        super(span, name, generics);
        this.impl = new ArrayList<>();
    }

    @Override
    public ASTElement detach() {
        Class rc = new Class(span, name, new ArrayList<>(generics));
        for (Entry<String, NewType> generic : generic_types.entrySet()) {
            if (generic.getValue().getResolution().isPresent()) {
                rc.setGeneric(generic.getKey(), (TypeElement) generic.getValue().getResolution().get().detach());
            }
        }

        for (Entry<String, Field> field : fields.entrySet()) {
            rc.insertField((Field) field.getValue().detach());
        }

        for (Function method : methods) {
            rc.insertMethod((Function) method.detach());
        }

        if (ext.isPresent()) {
            rc.setExtends((NamedType) ext.get().detach());
        }

        for (TypeElement imp : this.impl) {
            rc.insertImplementation((TypeElement) imp.detach());
        }

        return rc;
    }

    @Override
    public String format() {
        StringBuilder rc = new StringBuilder();
        rc.append("class ");
        rc.append(name);

        if (!this.generics.isEmpty()) {
            rc.append("<");
            rc.append(String.join(",", this.generics));
            rc.append(">");
        }

        if (this.ext.isPresent()) {
            rc.append(" extends " + this.ext.get().format());
        }

        if (!this.impl.isEmpty()) {
            rc.append(" implements ");
            List<String> inames = new ArrayList<>(this.impl.size());
            for (TypeElement imp : impl) {
                inames.add(imp.format());
            }
            rc.append(String.join(", ", inames));
        }

        rc.append(" {\n");
        for (Entry<String, NewType> generic : generic_types.entrySet()) {
            rc.append("  " + generic.getValue().format() + ";\n");
        }
        for (Entry<String, Field> field : fields.entrySet()) {
            rc.append("  " + field.getValue().format() + ";\n");
        }

        for (Function method : methods) {
            rc.append("\n" + method.format().indent(2));
        }

        rc.append("}");
        return rc.toString();
    }

    public void insertImplementation(TypeElement impl) {
        this.impl.add((TypeElement) impl.setParent(this));
    }

    public Optional<Function> getConstructor() {
        List<Function> c = getOverloadCandidates("constructor");
        if (c.isEmpty())
            return Optional.empty();
        Function f = c.get(0);
        if (isOwnMethod(f.getName())) {
            return Optional.of(c.get(0));
        } else {
            return Optional.empty();
        }
    }

    public void transform(ASTTransformer t) {
        for (Entry<String, Field> field : fields.entrySet()) {
            field.getValue().transform(t);
            fields.replace(field.getKey(), (Field) t.transform(field.getValue()).setParent(this));
        }

        int index = 0;
        for (Function method : methods) {
            method.transform(t);
            methods.set(index, (Function) t.transform(method).setParent(this));
            index++;
        }

        index = 0;
        for (TypeElement imp : impl) {
            imp.transform(t);
            impl.set(index, (TypeElement) t.transform(imp).setParent(this));
            index++;
        }
    }

    public boolean doesImplement(InterfaceType t) {
        for (TypeElement imp : this.interfaces()) {
            TypeElement res = imp.resolve();
            if (res instanceof InterfaceType) {
                if (t.getPath().equals(((InterfaceType) res).getPath())) {
                    return true;
                }
            }
        }
        if (this.ext.isPresent()) {
            return ((ClassType) this.ext.get().resolve()).getSource().doesImplement(t);
        }
        return false;
    }

    public List<TypeElement> interfaces() {
        Set<TypeElement> rc = new HashSet<>();
        if (this.ext.isPresent()) {
            rc.addAll(((ClassType) this.ext.get().resolve()).getSource().interfaces());
        }
        rc.addAll(impl);
        return Collections.unmodifiableList(new ArrayList<>(rc));
    }

    @Override
    public ClassType getOwnType() {
        return (ClassType) new ClassType(span, this.getPath()).setParent(this);
    }

    public ClassStaticType getStaticType() {
        return (ClassStaticType) new ClassStaticType(span, this.getPath()).setParent(this);
    }

    @Override
    public void generate(LLVMModule module) {
        if (this.generics.isEmpty()) {
            this.getOwnType().generate(module);

            List<LLVMType> argtypes = new ArrayList<>();
            Optional<Function> constructor = this.getConstructor();
            if (constructor.isPresent()) {
                for (Argument a : constructor.get().getArgumentList().subList(1,
                        constructor.get().getArgumentList().size())) {
                    argtypes.add(a.getOwnType().resolve().generate(module));
                }
            }
            LLVMType this_structure_type = this.getOwnType().generate(module);
            LLVMFunctionType allocator_type = new LLVMFunctionType(this_structure_type, argtypes);
            allocator = module.getOrInsertFunction(allocator_type, this.getPath() + "_alloc", f -> f.setExternal(),
                    true);
        }
    }

    public void generateMethods(LLVMModule module) {
        if (this.generics.isEmpty()) {
            List<LLVMConstant> methods = new ArrayList<>();
            LLVMConstant str = module.stringConstant(this.getPath());
            LLVMGlobalVariable name_var = module.getOrInsertGlobal(str.getType(), this.getPath() + "_name");
            name_var.setInitializer(str);

            methods.add(name_var
                    .cast(new LLVMPointerType<>(new LLVMIntType(module.getContext(), 8))));

            if (this.ext.isPresent()) {
                Class ext = ((ClassType) this.ext.get().resolve()).getSource();
                LLVMStructureType parent_type = ext.getStaticType().generate(module);
                LLVMGlobalVariable parent_stable = module.getOrInsertGlobal(
                        parent_type,
                        ext.getPath() + "_static");
                methods.add(parent_stable
                        .cast(new LLVMPointerType<>(new LLVMIntType(module.getContext(), 8))));
            } else {
                methods.add(new LLVMPointerType<>(new LLVMIntType(module.getContext(), 8)).getNull(module));
            }

            for (String name : this.getMethodNames()) {
                if (this.isOwnMethod(name)) {
                    Function m = this.getMethod(name).get();
                    Logger.trace("generating: " + m.getPath() + " (" + module.getName() + ")");
                    methods.add(m.generate(module));
                } else {
                    Function f = (Function) this.getMethod(name).get();
                    LLVMFunctionType type = (LLVMFunctionType) f.getOwnType().resolve().generate(module);

                    Logger.trace("declaring: " + f.getPath() + " (" + module.getName() + ")");
                    if (f.is_extern) {
                        methods.add(module.getOrInsertFunction(type, f.getOriginalName(), x -> x.setExternal(), true));
                    } else {
                        methods.add(module.getOrInsertFunction(type, f.getPath(), x -> x.setExternal(), true));
                    }
                }
            }

            for (Field f : this.getFields()) {
                if (f.isStatic()) {
                    methods.add(f.getOwnType().resolve().generate(module).getNull(module));
                }
            }

            LLVMStructureType static_type = this.getStaticType().generate(module);
            LLVMGlobalVariable g = module.getOrInsertGlobal(static_type, this.getPath() + "_static");
            LLVMConstant stable = static_type.createConstant(module.getContext(), methods);
            g.setInitializer(stable);

            for (TypeElement itype : this.interfaces()) {
                InterfaceType res = (InterfaceType) itype.resolve();
                LLVMStructureType itable_type = res.getSource().getStaticType().generate(module);
                LLVMGlobalVariable itable = module.getOrInsertGlobal(itable_type,
                        this.getPath() + "_interface_" + res.getSource().getPath());
                List<LLVMConstant> imethods = new ArrayList<>();

                imethods.add(name_var
                        .cast(new LLVMPointerType<>(new LLVMIntType(module.getContext(), 8))));

                if (this.ext.isPresent()) {
                    Class ext = ((ClassType) this.ext.get().resolve()).getSource();
                    LLVMStructureType parent_type = ext.getStaticType().generate(module);
                    LLVMGlobalVariable parent_stable = module.getOrInsertGlobal(
                            parent_type,
                            ext.getPath() + "_static");
                    imethods.add(parent_stable
                            .cast(new LLVMPointerType<>(new LLVMIntType(module.getContext(), 8))));
                } else {
                    imethods.add(new LLVMPointerType<>(new LLVMIntType(module.getContext(), 8)).getNull(module));
                }

                for (String name : res.getSource().getMethodNames()) {
                    Function m = this.getMethod(name).get();
                    LLVMType method_type = res.getSource().getMethod(name).get().getOwnType().generate(module);
                    LLVMFunction generated;
                    if (this.isOwnMethod(name)) {
                        Logger.trace("generating: " + m.getPath() + " (" + module.getName() + ")");
                        generated = m.generate(module);
                    } else {
                        LLVMFunctionType type = (LLVMFunctionType) m.getOwnType().resolve().generate(module);

                        Logger.trace("declaring: " + m.getPath() + " (" + module.getName() + ")");
                        if (m.is_extern) {
                            generated = module.getOrInsertFunction(type, m.getOriginalName(), x -> x.setExternal(),
                                    true);
                        } else {
                            generated = module.getOrInsertFunction(type, m.getPath(), x -> x.setExternal(), true);
                        }
                    }
                    imethods.add(generated.cast(new LLVMPointerType<LLVMType>(method_type)));
                }
                itable.setInitializer(itable_type.createConstant(module.getContext(), imethods));
            }

            try (LLVMBuilder builder = new LLVMBuilder(allocator.getModule())) {
                allocator.appendBasicBlock("entry");
                builder.positionAtEnd(allocator.lastBasicBlock());
                LLVMStructureType object_type = this.getOwnType().generateObjectType(module);
                LLVMValue object_allocation = builder.buildCall(module.getFunction("calloc").get(),
                        Arrays.asList(new LLVMValue[] {
                                (new LLVMIntType(module.getContext(), 64)).getConstant(module, 1),
                                builder.buildSizeofHack(object_type)
                        }), "");
                LLVMValue alloca = builder.buildAlloca(this.getOwnType().generate(module), "");
                LLVMValue object_pointer = builder.buildStructGEP(this.getOwnType().generate(module), alloca, 0,
                        "");
                builder.buildStore(builder.buildBitcast(object_allocation, new LLVMPointerType<>(object_type), ""),
                        object_pointer);
                LLVMValue stable_pointer = builder.buildStructGEP(this.getOwnType().generate(module), alloca, 1,
                        "");
                builder.buildStore(g, stable_pointer);

                Optional<Function> constructor = this.getConstructor();
                if (constructor.isPresent()) {
                    List<LLVMValue> cargs = new ArrayList<LLVMValue>();
                    cargs.add(builder.buildLoad(alloca, ""));
                    for (int i = 0; i < constructor.get().getArgumentList().size() - 1; i++) {
                        cargs.add(allocator.getParam(i));
                    }
                    builder.buildCall(constructor.get().generate(module), cargs, "");
                }

                builder.buildReturn(builder.buildLoad(alloca, ""));
            }
        }
    }

    public LLVMFunction getAllocator() {
        return allocator;
    }
}
