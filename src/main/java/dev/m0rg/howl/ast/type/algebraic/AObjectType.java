package dev.m0rg.howl.ast.type.algebraic;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;

import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.ObjectCommon;
import dev.m0rg.howl.ast.type.NewType;
import dev.m0rg.howl.ast.type.ObjectReferenceType;

public class AObjectType extends AStructureType {

    public AObjectType(ObjectReferenceType source, Map<String, AlgebraicType> typemap) {
        this.source = source;

        for (Function f : source.getSource().getMethods()) {
            // TODO: Atrocious hack so that I don't have to properly fix overloads.
            if (source.getSource().getOverloadCandidates(f.getOriginalName()).size() == 1) {
                non_overloaded.put(f.getOriginalName(), f.getName());
            }
        }

        for (Entry<String, NewType> g : source.getSource().getGenericTypes().entrySet()) {
            parameters.add(new AFreeType(g.getValue()));
        }
    }

    public AObjectType(AObjectType other, Map<String, AlgebraicType> evalmap) {
        super(other, evalmap);
    }

    public AObjectType(AObjectType other) {
        super(other);
    }

    ObjectCommon getSource() {
        return ((ObjectReferenceType) source).getSource();
    }

    public AlgebraicType getField(String name) {
        if (non_overloaded.containsKey(name)) {
            return getField(non_overloaded.get(name));
        }

        Map<String, AlgebraicType> selfmap = new HashMap<>();

        for (int i = 0; i < parameters.size(); i++) {
            selfmap.put(
                    new ArrayList<>(getSource().getGenericTypes().entrySet()).get(i).getValue().getPath(),
                    parameters.get(i));
        }

        if (getSource().getFieldNames().contains(name)) {
            return AlgebraicType.derive(getSource().getField(name).get().getOwnType()).evaluate(selfmap);
        }

        if (getSource().getMethod(name).isPresent()) {
            return AlgebraicType.derive(getSource().getMethod(name).get()).evaluate(selfmap);
        }
        // TODO this is only here so we don't blow up when overloads get involved
        return new AAnyType();
    }

    public AlgebraicType getFieldRaw(String name) {
        if (non_overloaded.containsKey(name)) {
            return getFieldRaw(non_overloaded.get(name));
        }

        if (getSource().getFieldNames().contains(name)) {
            return AlgebraicType.derive(getSource().getField(name).get().getOwnType());
        }

        return AlgebraicType.derive(getSource().getMethod(name).get());
    }

    public AlgebraicType evaluate(Map<String, AlgebraicType> evalmap) {
        return new AObjectType(this, evalmap);
    }

    public AlgebraicType half_evaluate() {
        return new AObjectType(this);
    }

}
