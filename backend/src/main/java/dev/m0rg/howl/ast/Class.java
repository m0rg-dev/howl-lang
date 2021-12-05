package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.Set;

public class Class extends ASTElement implements NamedElement, NameHolder, HasOwnType {
    String name;
    Optional<NamedType> ext;
    List<NamedType> impl;
    List<String> generics;
    LinkedHashMap<String, Field> fields;
    Map<String, NewType> generic_types;
    List<Function> methods;

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

    public void insertMethod(Function method) {
        List<Field> args = method.getArgumentList();
        StringBuilder mangled_name = new StringBuilder("_Z");
        mangled_name.append(method.getOriginalName().length());
        mangled_name.append(method.getOriginalName());
        mangled_name.append(args.size());
        mangled_name.append("E");
        for (Field f : args) {
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

    @Override
    public TypeElement getOwnType() {
        return (TypeElement) new ClassType(span, this.getPath()).setParent(this);
    }

    public ClassStaticType getStaticType() {
        return (ClassStaticType) new ClassStaticType(span, this.getPath()).setParent(this);
    }
}
