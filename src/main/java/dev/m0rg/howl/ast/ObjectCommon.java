package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.NewType;
import dev.m0rg.howl.ast.type.ObjectReferenceType;
import dev.m0rg.howl.ast.type.SpecifiedType;
import dev.m0rg.howl.ast.type.TypeElement;

public abstract class ObjectCommon extends ASTElement implements NamedElement, NameHolder {
    String name;
    List<String> generics;
    Map<String, NewType> generic_types;
    LinkedHashMap<String, Field> fields;
    List<Function> methods;
    Optional<NamedType> ext;

    public ObjectCommon(Span span, String name, List<String> generics) {
        super(span);
        this.name = name;
        this.generics = generics;

        this.generic_types = new HashMap<String, NewType>();
        this.fields = new LinkedHashMap<String, Field>();
        this.methods = new ArrayList<Function>();
        this.ext = Optional.empty();

        for (String generic : generics) {
            generic_types.put(generic, (NewType) new NewType(span, generic).setParent(this));
        }
    }

    public Optional<NamedType> getExtends() {
        return ext;
    }

    public void setExtends(NamedType ext) {
        this.ext = Optional.of((NamedType) ext.setParent(this));
    }

    public void setGeneric(String name, TypeElement res) {
        this.generic_types.get(name).setResolution(res);
    }

    public List<String> getGenericNames() {
        return Collections.unmodifiableList(generics);
    }

    public Map<String, NewType> getGenericTypes() {
        return Collections.unmodifiableMap(generic_types);
    }

    public boolean isGeneric() {
        return generics.size() > 0;
    }

    public void clearGenerics() {
        generics = new ArrayList<>();
    }

    public void insertNewtype(String name) {
        generic_types.put(name, (NewType) new NewType(span, name).setParent(this));
    }

    public void insertField(Field contents) {
        this.fields.put(contents.getName(), (Field) contents.setParent(this));
    }

    public Optional<Field> getField(String name) {
        if (fields.containsKey(name)) {
            return Optional.of(fields.get(name));
        } else if (this.ext.isPresent()) {
            ObjectReferenceType t = (ObjectReferenceType) this.ext.get().resolve();
            return t.getField(name);
        } else {
            return Optional.empty();
        }
    }

    public List<String> getFieldNames() {
        List<String> names = new ArrayList<>(fields.keySet());
        if (this.ext.isPresent()) {
            names.addAll(((ObjectReferenceType) this.ext.get().resolve()).getFieldNames());
        }
        return Collections.unmodifiableList(names);
    }

    public List<Field> getFields() {
        List<Field> fields = new ArrayList<>(this.fields.values());
        if (this.ext.isPresent()) {
            fields.addAll(((ObjectReferenceType) this.ext.get().resolve()).getSource().getFields());
        }
        return Collections.unmodifiableList(fields);
    }

    public Optional<Function> getMethod(String name) {
        for (Function m : methods) {
            if (m.getName().equals(name)) {
                return Optional.of(m);
            }
        }
        if (this.ext.isPresent()) {
            return ((ObjectReferenceType) this.ext.get().resolve()).getSource().getMethod(name);
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

    public List<String> getMethodNames() {
        Set<String> names = new HashSet<>();
        if (this.ext.isPresent()) {
            names.addAll(((ObjectReferenceType) this.ext.get().resolve()).getSource().getMethodNames());
        }

        for (Function m : methods) {
            names.add(m.getName());
        }
        return new ArrayList<>(names);
    }

    public List<Function> getMethods() {
        List<Function> methods = new ArrayList<>();
        for (String name : this.getMethodNames()) {
            methods.add(this.getMethod(name).get());
        }
        return Collections.unmodifiableList(methods);
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

    public List<Function> getOverloadCandidates(String name) {
        List<Function> rc = new ArrayList<>();
        for (Function m : this.synthesizeMethods()) {
            if (m.getOriginalName().equals(name)) {
                rc.add(m);
            }
        }
        return rc;
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

    public void setName(String name) {
        if (this.parent != null) {
            throw new RuntimeException("setting the name on an owned Object is a terrible idea");
        }
        this.name = name;
    }

    public String getName() {
        return this.name;
    }

    // TODO merge with MonomorphizeClasses
    public ObjectCommon monomorphize(SpecifiedType spec) {
        ObjectCommon specified = (ObjectCommon) this.detach();
        specified.setName(spec.mangle());
        for (int i = 0; i < spec.getParameters().size(); i++) {
            TypeElement p = spec.getParameters().get(i);
            p = (TypeElement) p.detach();
            specified.setGeneric(specified.getGenericNames().get(i),
                    p);
        }
        specified.clearGenerics();
        return specified;
    }
}
