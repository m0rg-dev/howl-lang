package dev.m0rg.howl.ast;

import java.lang.ProcessBuilder.Redirect.Type;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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

public class Class extends ASTElement implements NamedElement, NameHolder, HasOwnType, GeneratesTopLevelItems {
    String name;
    Optional<NamedType> ext;
    List<TypeElement> impl;
    List<String> generics;
    LinkedHashMap<String, Field> fields;
    Map<String, NewType> generic_types;
    List<Function> methods;

    LLVMFunction allocator;

    public Class(Span span, String name, List<String> generics) {
        super(span);
        this.name = name;
        this.generics = generics;
        this.fields = new LinkedHashMap<String, Field>();
        this.methods = new ArrayList<Function>();
        this.generic_types = new HashMap<String, NewType>();
        this.ext = Optional.empty();
        this.impl = new ArrayList<>();

        for (String generic : generics) {
            generic_types.put(generic, (NewType) new NewType(span, generic).setParent(this));
        }
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

    public Optional<NamedType> getExtends() {
        return ext;
    }

    public void setExtends(NamedType ext) {
        this.ext = Optional.of((NamedType) ext.setParent(this));
    }

    public void insertImplementation(TypeElement impl) {
        this.impl.add((TypeElement) impl.setParent(this));
    }

    public void insertField(Field contents) {
        this.fields.put(contents.getName(), (Field) contents.setParent(this));
    }

    public Optional<Field> getField(String name) {
        if (fields.containsKey(name)) {
            return Optional.of(fields.get(name));
        } else if (this.ext.isPresent()) {
            ClassType t = (ClassType) this.ext.get().resolve();
            return t.getField(name);
        } else {
            return Optional.empty();
        }
    }

    public Optional<Function> getMethod(String name) {
        for (Function m : methods) {
            if (m.getName().equals(name)) {
                return Optional.of(m);
            }
        }
        if (this.ext.isPresent()) {
            return ((ClassType) this.ext.get().resolve()).getSource().getMethod(name);
        }
        return Optional.empty();
    }

    public boolean isOwnMethod(String name) {
        for (Function m : methods) {
            if (m.getName().equals(name)) {
                return true;
            }
        }
        return false;
    }

    public List<Function> getOverloadCandidates(String name) {
        List<Function> rc = new ArrayList<>();
        for (Function m : this.synthesizeMethods()) {
            if (m.getOriginalName().equals(name)) {
                rc.add(m);
            }
        }
        return rc;
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

    public void insertMethod(Function method) {
        method.setParent(this);
        List<Argument> args = method.getArgumentList();
        StringBuilder mangled_name = new StringBuilder("_Z");
        mangled_name.append(method.getOriginalName().length());
        mangled_name.append(method.getOriginalName());
        mangled_name.append(args.size());
        mangled_name.append("E");
        for (Argument f : args) {
            mangled_name.append(f.getOwnType().mangle());
        }
        method.setNameUnchecked(mangled_name.toString());
        this.methods.add(method);
    }

    public void setGeneric(String name, TypeElement res) {
        this.generic_types.get(name).setResolution(res);
    }

    public List<String> getGenericNames() {
        return Collections.unmodifiableList(generics);
    }

    public List<String> getFieldNames() {
        List<String> names = new ArrayList<>(fields.keySet());
        if (this.ext.isPresent()) {
            names.addAll(((ClassType) this.ext.get().resolve()).getFieldNames());
        }
        return Collections.unmodifiableList(names);
    }

    public List<String> getMethodNames() {
        Set<String> names = new HashSet<>();
        if (this.ext.isPresent()) {
            names.addAll(((ClassType) this.ext.get().resolve()).getSource().getMethodNames());
        }

        for (Function m : methods) {
            names.add(m.getName());
        }
        return new ArrayList<>(names);
    }

    // TODO figure out where this can be used
    public List<Function> synthesizeMethods() {
        List<String> names = getMethodNames();
        List<Function> rc = new ArrayList<>(names.size());
        for (String name : names) {
            rc.add(getMethod(name).get());
        }
        return rc;
    }

    public void clearGenerics() {
        generics = new ArrayList<>();
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

    public void setName(String name) {
        if (this.parent != null) {
            throw new RuntimeException("setting the name on an owned Class is a terrible idea");
        }
        this.name = name;
    }

    public String getName() {
        return this.name;
    }

    public Optional<ASTElement> getChild(String name) {
        if (name.equals("Self")) {
            return Optional.of(this);
        }

        if (this.generic_types.containsKey(name)) {
            return Optional.of(this.generic_types.get(name));
        }

        for (Function m : methods) {
            if (m.name.equals(name)) {
                return Optional.of(m);
            }
        }

        return Optional.empty();
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
                methods.add(new LLVMPointerType<>(new LLVMIntType(module.getContext(), 8)).getNull());
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
                    imethods.add(new LLVMPointerType<>(new LLVMIntType(module.getContext(), 8)).getNull());
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
                    int i = 0;
                    for (Argument a : constructor.get().getArgumentList().subList(1,
                            constructor.get().getArgumentList().size())) {
                        cargs.add(allocator.getParam(i));
                        i++;
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

    public boolean isMonomorphic() {
        return this.generics.isEmpty();
    }
}
