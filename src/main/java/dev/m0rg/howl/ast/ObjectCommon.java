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

import dev.m0rg.howl.ast.type.HasOwnType;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.NewType;
import dev.m0rg.howl.ast.type.ObjectReferenceType;
import dev.m0rg.howl.ast.type.SpecifiedType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.logger.Logger;
import dev.m0rg.howl.transform.InferTypes;
import dev.m0rg.howl.transform.Monomorphize2;

public abstract class ObjectCommon extends ASTElement implements NamedElement, NameHolder, HasOwnType, Walkable {
    String name;
    List<String> generics;
    Map<String, NewType> generic_types;
    LinkedHashMap<String, Field> fields;
    List<Function> methods;
    Optional<NamedType> ext;
    public AStructureReference original;

    public ObjectCommon(Span span, String name, List<String> generics) {
        super(span);
        this.name = name;
        this.generics = generics;

        this.generic_types = new HashMap<String, NewType>();
        this.fields = new LinkedHashMap<String, Field>();
        this.methods = new ArrayList<Function>();
        this.ext = Optional.empty();

        for (String generic : generics) {
            generic_types.put(generic, (NewType) new NewType(span, generic, generic_types.size()).setParent(this));
        }
    }

    public Optional<NamedType> getExtends() {
        return ext;
    }

    public void setExtends(NamedType ext) {
        this.ext = Optional.of((NamedType) ext.setParent(this));
    }

    public void setGeneric(String name, ALambdaTerm res) {
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
        generic_types.put(name, (NewType) new NewType(span, name, generic_types.size()).setParent(this));
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

    public int getStaticFieldIndex(String name) {
        int idx = -1;
        for (int i = 0; i < getFields().size();) {
            Field f = getFields().get(i);
            Logger.trace(f.format());
            if (f.isStatic()) {
                if (f.getName().equals(name)) {
                    idx = i;
                    break;
                }
                i++;
            }
        }

        if (idx >= 0) {
            idx += this.synthesizeMethods().size();
        }
        return idx;
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
        List<String> names = new ArrayList<>();
        if (this.ext.isPresent()) {
            names.addAll(((ObjectReferenceType) this.ext.get().resolve()).getSource().getMethodNames());
        }

        for (Function m : methods) {
            if (names.stream().noneMatch(x -> x.equals(m.getName()))) {
                names.add(m.getName());
            }
        }
        return names;
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

    // TODO: constructor overloads
    public Optional<Function> getConstructor() {
        for (Function m : this.methods) {
            if (m.getOriginalName().equals("constructor")) {
                return Optional.of(m);
            }
        }
        if (this.ext.isPresent()) {
            return ((ObjectReferenceType) this.ext.get().resolve()).getSource().getConstructor();
        }
        return Optional.empty();
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

    protected void insertMethodUnchecked(Function method) {
        method.setParent(this);
        this.methods.add(method);
    }

    public Optional<ASTElement> getChild(String name) {
        if (name.equals("Self")) {
            if (this.isGeneric()) {
                SpecifiedType rc = new SpecifiedType(span);
                rc.setBase((TypeElement) this.getOwnType().detach());
                for (Entry<String, NewType> t : this.generic_types.entrySet()) {
                    rc.insertParameter((TypeElement) t.getValue().detach());
                }
                rc.setParent(this);
                return Optional.of(rc);
            } else {
                return Optional.of(this);
            }
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

    static Set<String> monomorphized = new HashSet<>();

    public void monomorphize(AStructureReference spec) {
        if (monomorphized.contains(spec.mangle())) {
            return;
        }
        monomorphized.add(spec.mangle());
        ObjectCommon specified = (ObjectCommon) this.detach();
        specified.setName(spec.mangle());
        for (int i = 0; i < this.generics.size(); i++) {
            ALambdaTerm p = spec.getSubstitutions().get("T" + i);
            specified.setGeneric(this.generics.get(i), p);
        }
        specified.clearGenerics();
        ((Module) this.getParent()).insertItem(specified);
        specified.original = spec;
        specified.transform(new InferTypes());
        Monomorphize2 sub_types = new Monomorphize2();
        specified.transform(sub_types);
        for (AStructureReference r : sub_types.getToGenerate()) {
            Logger.trace("generate: " + r.format() + " " + r.mangle());
            r.getSource().getSource().monomorphize(r);
        }

        Logger.trace("MONOMORPHIZE " + specified.getName());
        Logger.trace(specified.format());
    }

    public List<ASTElement> getContents() {
        List<ASTElement> rc = new ArrayList<>(fields.values());
        rc.addAll(methods);
        return rc;
    }

    public abstract ObjectReferenceType getOwnType();
}
