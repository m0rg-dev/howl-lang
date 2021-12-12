package dev.m0rg.howl.ast.type.algebraic;

import java.util.Map;

public class ACallResult extends AlgebraicType {
    AlgebraicType source;

    public ACallResult(AlgebraicType source) {
        this.source = source;
    }

    public String format() {
        return this.source.format() + ".()";
    }

    public AlgebraicType getSource() {
        return source;
    }

    @Override
    public AlgebraicType evaluate(Map<String, AlgebraicType> evalmap) {
        AlgebraicType source_type = source.evaluate(evalmap);
        if (source_type instanceof AFunctionType) {
            return ((AFunctionType) source_type).returntype.evaluate(evalmap);
        } else if (source_type instanceof AAnyType) {
            return source_type;
        }
        throw new RuntimeException(source_type.format());
    }

    @Override
    public AlgebraicType half_evaluate() {
        AlgebraicType source_type = source.half_evaluate();
        if (source_type instanceof AFunctionType) {
            return ((AFunctionType) source_type).returntype.half_evaluate();
        }
        throw new RuntimeException(source_type.format());
    }
}
