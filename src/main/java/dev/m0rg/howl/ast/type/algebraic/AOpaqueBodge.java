package dev.m0rg.howl.ast.type.algebraic;

import java.util.Map;

import dev.m0rg.howl.ast.type.TypeElement;

public class AOpaqueBodge extends AlgebraicType {
    TypeElement source;

    public AOpaqueBodge(TypeElement source) {
        this.source = source;
    }

    public TypeElement toElement() {
        return source;
    }

    @Override
    public String format() {
        return "## " + source.format() + " ##";
    }

    @Override
    public AlgebraicType evaluate(Map<String, AlgebraicType> evalmap) {
        return this;
    }
}
