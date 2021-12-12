package dev.m0rg.howl.ast.type.algebraic;

import java.util.Map;

public class AIndexResult extends AlgebraicType {
    AlgebraicType source;

    public AIndexResult(AlgebraicType source) {
        this.source = source;
    }

    public String format() {
        return this.source.format() + ".[]";
    }

    @Override
    public AlgebraicType evaluate(Map<String, AlgebraicType> evalmap) {
        AlgebraicType source_type = source.evaluate(evalmap);
        if (source_type instanceof ARawPointer) {
            return ((ARawPointer) source_type).source.evaluate(evalmap);
        }
        throw new RuntimeException(source_type.format());
    }
}
