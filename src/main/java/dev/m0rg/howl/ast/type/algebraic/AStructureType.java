package dev.m0rg.howl.ast.type.algebraic;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import dev.m0rg.howl.ast.Field;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.type.NewType;
import dev.m0rg.howl.ast.type.ObjectReferenceType;
import dev.m0rg.howl.logger.Logger;

public class AStructureType extends AlgebraicType {
    ObjectReferenceType source;

    List<AlgebraicType> parameters;
    Map<String, String> non_overloaded;

    public AStructureType(ObjectReferenceType source, Map<String, AlgebraicType> typemap) {
        this.source = source;
        parameters = new ArrayList<>();
        non_overloaded = new HashMap<>();

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

    AStructureType(AStructureType other, Map<String, AlgebraicType> evalmap) {
        source = other.source;
        parameters = new ArrayList<>();

        for (AlgebraicType p : other.parameters) {
            parameters.add(p.evaluate(evalmap));
        }

        non_overloaded = new HashMap<>(other.non_overloaded);
    }

    AStructureType(AStructureType other) {
        source = other.source;
        parameters = new ArrayList<>();

        for (AlgebraicType p : other.parameters) {
            parameters.add(p.half_evaluate());
        }

        non_overloaded = new HashMap<>(other.non_overloaded);
    }

    public String format() {
        List<String> parts = new ArrayList<>();
        parts.add("source " + this.source.getPath());
        for (int i = 0; i < parameters.size(); i++) {
            parts.add(i + " = " + parameters.get(i).format());
        }

        return "{\n" + String.join("\n", parts).indent(2) + "}";
    }

    public AlgebraicType getField(String name) {
        if (non_overloaded.containsKey(name)) {
            return getField(non_overloaded.get(name));
        }

        Map<String, AlgebraicType> selfmap = new HashMap<>();

        for (int i = 0; i < parameters.size(); i++) {
            selfmap.put(
                    new ArrayList<>(source.getSource().getGenericTypes().entrySet()).get(i).getValue().getPath(),
                    parameters.get(i));
        }

        if (source.getFieldNames().contains(name)) {
            return AlgebraicType.derive(source.getField(name).get().getOwnType()).evaluate(selfmap);
        }

        return AlgebraicType.derive(source.getSource().getMethod(name).get()).evaluate(selfmap);
    }

    AlgebraicType getFieldRaw(String name) {
        if (non_overloaded.containsKey(name)) {
            return getFieldRaw(non_overloaded.get(name));
        }

        if (source.getFieldNames().contains(name)) {
            return AlgebraicType.derive(source.getField(name).get().getOwnType());
        }

        return AlgebraicType.derive(source.getSource().getMethod(name).get());
    }

    public AlgebraicType evaluate(Map<String, AlgebraicType> evalmap) {
        return new AStructureType(this, evalmap);
    }

    public AlgebraicType half_evaluate() {
        return new AStructureType(this);
    }
}
