package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.Set;

import dev.m0rg.howl.ast.type.ClassType;
import dev.m0rg.howl.ast.type.InterfaceType;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.NewType;
import dev.m0rg.howl.ast.type.TypeConstraint;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.ast.type.algebraic.ADefer;
import dev.m0rg.howl.ast.type.algebraic.AFunctionReference;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AIntersectionType;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;
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

public class Class extends ObjectCommon implements GeneratesTopLevelItems {
    List<TypeElement> impl;

    public Class(Span span, String name, List<String> generics, boolean _a) {
        super(span, name, generics);
        this.impl = new ArrayList<>();
    }

    public Class(Span span, String name, List<ASTElement> generics) {
        super(span, name, generics.stream().map(x -> {
            if (x instanceof Identifier) {
                return ((Identifier) x).getName();
            } else if (x instanceof TypeConstraint) {
                return ((TypeConstraint) x).getName();
            } else {
                throw new RuntimeException();
            }
        }).toList());

        for (ASTElement e : generics) {
            if (e instanceof TypeConstraint) {
                List<ALambdaTerm> params = ((TypeConstraint) e).getConstraints().stream()
                        .map(x -> (ALambdaTerm) new ADefer((TypeElement) x.detach().setParent(this))).toList();
                this.setGeneric(((TypeConstraint) e).getName(), new AIntersectionType(params));
            }
        }

        this.impl = new ArrayList<>();
    }

    @Override
    public ASTElement detach() {
        Class rc = new Class(span, name, new ArrayList<>(generics), true);
        for (Entry<String, NewType> generic : generic_types.entrySet()) {
            if (generic.getValue().getResolution().isPresent()) {
                rc.setGeneric(generic.getKey(), generic.getValue().getResolution().get());
            }
        }

        for (Entry<String, Field> field : fields.entrySet()) {
            rc.insertField((Field) field.getValue().detach());
        }

        for (Function method : methods) {
            rc.insertMethodUnchecked((Function) method.detach());
        }

        if (ext.isPresent()) {
            rc.setExtends((NamedType) ext.get().detach());
        }

        for (TypeElement imp : this.impl) {
            rc.insertImplementation((TypeElement) imp.detach());
        }

        rc.original = original;

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
            ALambdaTerm res = ALambdaTerm.evaluate(AlgebraicType.derive(imp));
            if (res instanceof AStructureReference) {
                if (t.getSource().getPath().equals(((AStructureReference) res).getSource().getSource().getPath())) {
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

    @Override
    public void generate(LLVMModule module) {
        ;
    }

    public void generateMethods(LLVMModule module) {
        if (!this.isGeneric()) {
            List<LLVMConstant> methods = new ArrayList<>();
            LLVMConstant str = module.stringConstant(this.getPath());
            LLVMGlobalVariable name_var = module.getOrInsertGlobal(str.getType(), this.getPath() + "_name");
            name_var.setInitializer(str);

            methods.add(name_var
                    .cast(new LLVMPointerType<>(new LLVMIntType(module.getContext(), 8))));
            methods.add(this.getParentTable(module));

            methods.addAll(this.generateMethodList(module));
            for (Field f : getFields()) {
                if (f.isStatic()) {
                    methods.add(ALambdaTerm.evaluateFrom(f.getOwnType()).toLLVM(module).getNull(module));
                }
            }

            AStructureReference this_type = (AStructureReference) ALambdaTerm.evaluateFrom(this.getOwnType());
            LLVMStructureType static_type = this_type.generateStaticType(module);
            LLVMGlobalVariable static_global = module.getOrInsertGlobal(static_type, this.getPath() + "_static");
            LLVMConstant stable = static_type.createConstant(module.getContext(), methods);
            static_global.setInitializer(stable);

            this.generateAllocator(module);
            this.generateInterfaceTables(module);
        }
    }

    LLVMConstant getParentTable(LLVMModule module) {
        if (this.ext.isPresent()) {
            AStructureReference ext_type = (AStructureReference) ALambdaTerm.evaluateFrom(this.ext.get());
            ext_type.toLLVM(module);
            LLVMType parent_type = ext_type.generateStaticType(module);
            LLVMGlobalVariable parent_stable = module.getOrInsertGlobal(
                    parent_type,
                    ext_type.getSourcePath() + "_static");
            return parent_stable
                    .cast(new LLVMPointerType<>(new LLVMIntType(module.getContext(), 8)));
        } else {
            return new LLVMPointerType<>(new LLVMIntType(module.getContext(), 8)).getNull(module);
        }
    }

    List<LLVMConstant> generateMethodList(LLVMModule module) {
        List<LLVMConstant> methods = new ArrayList<>();

        for (String name : this.getMethodNames()) {
            if (this.isOwnMethod(name)) {
                Function m = this.getMethod(name).get();
                Logger.trace("generating: " + m.getPath() + " (" + module.getName() + ")");
                methods.add(m.generate(module));
            } else {
                Function f = (Function) this.getMethod(name).get();
                LLVMFunctionType type = (new AFunctionReference(f)).toLLVM(module);

                Logger.trace("declaring: " + f.getPath() + " (" + module.getName() + ")");
                if (f.is_extern) {
                    methods.add(module.getOrInsertFunction(type, f.getOriginalName(), x -> x.setExternal(), true));
                } else {
                    methods.add(module.getOrInsertFunction(type, f.getPath(), x -> x.setExternal(), true));
                }
            }
        }

        return methods;
    }

    void generateInterfaceTables(LLVMModule module) {
        LLVMConstant str = module.stringConstant(this.getPath());
        LLVMGlobalVariable name_var = module.getOrInsertGlobal(str.getType(), this.getPath() + "_name");

        for (TypeElement itype : this.interfaces()) {
            AStructureReference res_type = (AStructureReference) ALambdaTerm.evaluateFrom(itype);
            InterfaceType res = (InterfaceType) res_type.getSourceResolved();
            LLVMStructureType itable_type = res_type.generateStaticType(module);
            LLVMGlobalVariable itable = module.getOrInsertGlobal(itable_type,
                    this.getPath() + "_interface_" + res.getSource().getPath());
            List<LLVMConstant> imethods = new ArrayList<>();

            imethods.add(name_var
                    .cast(new LLVMPointerType<>(new LLVMIntType(module.getContext(), 8))));
            imethods.add(this.getParentTable(module));

            for (String name : res.getSource().getMethodNames()) {
                Logger.trace("method: " + name);
                LLVMType method_type = (new AFunctionReference(res.getSource().getMethod(name).get())).toLLVM(module);
                LLVMFunction generated;
                if (this.isOwnMethod(name)) {
                    Function m = this.getMethod(name).get();
                    Logger.trace("generating: " + m.getPath() + " (" + module.getName() + ")");
                    generated = m.generate(module);
                } else {
                    Function f = (Function) this.getMethod(name).get();
                    LLVMFunctionType type = (new AFunctionReference(f)).toLLVM(module);

                    Logger.trace("declaring: " + f.getPath() + " (" + module.getName() + ")");
                    if (f.is_extern) {
                        generated = module.getOrInsertFunction(type, f.getOriginalName(), x -> x.setExternal(), true);
                    } else {
                        generated = module.getOrInsertFunction(type, f.getPath(), x -> x.setExternal(), true);
                    }
                }
                imethods.add(generated.cast(new LLVMPointerType<LLVMType>(method_type)));
            }
            itable.setInitializer(itable_type.createConstant(module.getContext(), imethods));
        }
    }

    void generateAllocator(LLVMModule module) {
        AStructureReference this_type = (AStructureReference) ALambdaTerm.evaluateFrom(this.getOwnType());
        String allocator_name = this_type.getSourcePath() + "_alloc";

        LLVMFunctionType allocator_type = new LLVMFunctionType(
                this_type.toLLVM(module),
                new ArrayList<>());
        LLVMFunction allocator;
        if (module.getFunction(allocator_name).isPresent()) {
            allocator = module.getFunction(allocator_name).get();
        } else {
            allocator = new LLVMFunction(module, allocator_name, allocator_type);
        }

        // avoid generating the allocator body multiple times
        if (allocator.countBasicBlocks() > 0)
            return;

        LLVMStructureType this_llvm_type = this_type.toLLVM(module);
        LLVMStructureType object_type = this_type.generateObjectType(module);
        LLVMStructureType static_type = this_type.generateStaticType(module);
        LLVMGlobalVariable static_global = module.getOrInsertGlobal(static_type, this.getPath() + "_static");

        try (LLVMBuilder builder = new LLVMBuilder(allocator.getModule())) {
            allocator.appendBasicBlock("entry");
            builder.positionAtEnd(allocator.lastBasicBlock());
            LLVMValue object_allocation = builder.buildCall(module.getFunction("calloc").get(),
                    Arrays.asList(new LLVMValue[] {
                            (new LLVMIntType(module.getContext(), 64)).getConstant(module, 1),
                            builder.buildSizeofHack(object_type)
                    }), "");
            LLVMValue alloca = builder.buildAlloca(this_llvm_type, "");
            LLVMValue object_pointer = builder.buildStructGEP(this_llvm_type, alloca, 0,
                    "");
            builder.buildStore(builder.buildBitcast(object_allocation, new LLVMPointerType<>(object_type), ""),
                    object_pointer);
            LLVMValue stable_pointer = builder.buildStructGEP(this_llvm_type, alloca, 1,
                    "");
            builder.buildStore(static_global, stable_pointer);

            builder.buildReturn(builder.buildLoad(alloca, ""));
        }
    }
}
