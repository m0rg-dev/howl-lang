package dev.m0rg.howl.ast.type;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Map.Entry;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Argument;
import dev.m0rg.howl.ast.Field;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.NameHolder;
import dev.m0rg.howl.ast.ObjectCommon;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.llvm.LLVMModule;
import dev.m0rg.howl.llvm.LLVMType;

public class ObjectSnapshotType extends TypeElement implements StructureType, NameHolder {
    String name;
    List<Field> fields;
    Map<String, NewType> generic_types;

    public ObjectSnapshotType(Span span, ObjectCommon source) {
        super(span);
        name = source.getName();
        fields = new ArrayList<>(source.getFields());
        generic_types = new HashMap<>();
        for (Function f : source.getMethods()) {
            LambdaType t = new LambdaType(f.getSpan());
            t.setReturn((TypeElement) f.getReturn().detach());
            for (Argument a : f.getArgumentList()) {
                t.insertArgument((TypeElement) a.getOwnType().detach());
            }
            Field mf = (Field) new Field(f.getSpan(), f.getName()).setParent(this);
            mf.setType(t);
            fields.add(mf);

            // TODO: Atrocious hack so that I don't have to properly fix overloads.
            if (source.getOverloadCandidates(f.getOriginalName()).size() == 1) {
                Field cf = (Field) new Field(f.getSpan(), f.getOriginalName()).setParent(this);
                cf.setType((LambdaType) t.detach());
                fields.add(cf);
            }
        }

        for (Entry<String, NewType> generic : source.getGenericTypes().entrySet()) {
            generic_types.put(generic.getKey(), (NewType) generic.getValue().detach().setParent(this));
        }
    }

    @Override
    public Optional<Field> getField(String name) {
        for (Field f : this.fields) {
            if (f.getName().equals(name)) {
                return Optional.of(f);
            }
        }
        return Optional.empty();
    }

    @Override
    public List<String> getFieldNames() {
        List<String> names = new ArrayList<>();
        for (Field f : this.fields) {
            names.add(f.getName());
        }
        return Collections.unmodifiableList(names);
    }

    @Override
    public String mangle() {
        throw new UnsupportedOperationException();
    }

    @Override
    public boolean accepts(TypeElement other) {
        throw new UnsupportedOperationException();
    }

    @Override
    public LLVMType generate(LLVMModule module) {
        throw new UnsupportedOperationException();
    }

    @Override
    public ASTElement detach() {
        throw new UnsupportedOperationException();
    }

    @Override
    public String format() {
        List<String> parts = new ArrayList<>();
        for (Field f : this.fields) {
            parts.add(f.format());
        }
        for (Entry<String, NewType> g : this.generic_types.entrySet()) {
            parts.add(g.getValue().format());
        }
        return this.name + " {\n" + String.join("\n", parts).indent(2) + "}";
    }

    @Override
    public void transform(ASTTransformer t) {
        throw new UnsupportedOperationException();
    }

    @Override
    public Optional<ASTElement> getChild(String name) {
        if (name.equals("Self")) {
            return Optional.of(this);
        }
        Optional<Field> f = this.getField(name);
        if (f.isPresent()) {
            return Optional.of(f.get());
        }
        if (this.generic_types.containsKey(name)) {
            return Optional.of(this.generic_types.get(name));
        }
        return Optional.empty();
    }

    public Map<String, NewType> getGenericTypes() {
        return Collections.unmodifiableMap(generic_types);
    }
}
