package dev.m0rg.howl.ast.type.algebraic;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import dev.m0rg.howl.ast.type.TypeElement;

public abstract class AStructureType extends AlgebraicType {
    TypeElement source;

    List<AlgebraicType> parameters;
    Map<String, String> non_overloaded;

    AStructureType() {
        parameters = new ArrayList<>();
        non_overloaded = new HashMap<>();
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

    public List<AlgebraicType> getParameters() {
        return Collections.unmodifiableList(parameters);
    }

    public String format() {
        List<String> parts = new ArrayList<>();
        parts.add("source " + this.source.getPath());
        for (int i = 0; i < parameters.size(); i++) {
            parts.add(i + " = " + parameters.get(i).format());
        }

        return "{\n" + String.join("\n", parts).indent(2) + "}";
    }

    public TypeElement toElement() {
        return source;
    }

    public abstract AlgebraicType getField(String name);

    public abstract AlgebraicType getFieldRaw(String name);
}
