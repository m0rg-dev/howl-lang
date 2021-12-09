package dev.m0rg.howl.ast;

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

public class Class extends ASTElement implements NamedElement, NameHolder, HasOwnType, GeneratesTopLevelItems {
    String name;
    Optional<NamedType> ext;
    List<NamedType> impl;
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

        for (NamedType imp : this.impl) {
            rc.insertImplementation((NamedType) imp.detach());
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
            for (NamedType imp : impl) {
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

    public void setExtends(NamedType ext) {
        this.ext = Optional.of((NamedType) ext.setParent(this));
    }

    public void insertImplementation(NamedType impl) {
        this.impl.add((NamedType) impl.setParent(this));
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
        return Optional.empty();
    }

    public List<Function> getOverloadCandidates(String name) {
        List<Function> rc = new ArrayList<>();
        for (Function m : methods) {
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
        return Optional.of(c.get(0));
    }

    public void insertMethod(Function method) {
        List<Argument> args = method.getArgumentList();
        StringBuilder mangled_name = new StringBuilder("_Z");
        mangled_name.append(method.getOriginalName().length());
        mangled_name.append(method.getOriginalName());
        mangled_name.append(args.size());
        mangled_name.append("E");
        for (Argument f : args) {
            mangled_name.append(f.getOwnType().mangle());
        }
        method.setName(mangled_name.toString());
        this.methods.add((Function) method.setParent(this));
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
        for (Function m : methods) {
            names.add(m.getName());
        }
        return new ArrayList<>(names);
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
        for (NamedType imp : impl) {
            Optional<String> n = imp.resolveName(imp.getName()).map(x -> x.getPath());
            if (n.isPresent() && n.get().equals(t.getSource().getPath())) {
                return true;
            }
        }
        return false;
    }

    public List<NamedType> interfaces() {
        return Collections.unmodifiableList(impl);
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
            allocator = new LLVMFunction(module, this.getPath() + "_alloc", allocator_type);
        }
    }

    public void generateMethods(LLVMModule module) {
        if (this.generics.isEmpty()) {
            List<LLVMConstant> methods = new ArrayList<>();
            for (String name : this.getMethodNames()) {
                Function m = this.getMethod(name).get();
                methods.add(m.generate(module));
            }

            LLVMStructureType static_type = this.getStaticType().generate(module);
            LLVMGlobalVariable g = module.getOrInsertGlobal(static_type, this.getPath() + "_static");
            LLVMConstant stable = static_type.createConstant(module.getContext(), methods);
            g.setInitializer(stable);

            for (NamedType itype : this.interfaces()) {
                InterfaceType res = (InterfaceType) itype.resolve();
                LLVMStructureType itable_type = res.getSource().getStaticType().generate(module);
                LLVMGlobalVariable itable = module.getOrInsertGlobal(itable_type,
                        this.getPath() + "_interface_" + res.getSource().getPath());
                List<LLVMConstant> imethods = new ArrayList<>();
                for (String name : res.getSource().getMethodNames()) {
                    Function m = this.getMethod(name).get();
                    LLVMType method_type = res.getSource().getMethod(name).get().getOwnType().generate(module);
                    imethods.add(m.generate(module).cast(new LLVMPointerType<LLVMType>(method_type)));
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
}
