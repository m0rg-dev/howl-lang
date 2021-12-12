package dev.m0rg.howl.ast.type.algebraic;

import dev.m0rg.howl.logger.Logger;

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
    public AlgebraicType half_evaluate() {
        AlgebraicType source_type = source.half_evaluate();
        if (source_type instanceof AFunctionType) {
            return ((AFunctionType) source_type).returntype;
        } else if (source_type instanceof ASpecify) {
            if (((ASpecify) source_type).source instanceof AFunctionType) {
                Logger.info(((ASpecify) source_type).source.format());
                throw new RuntimeException();
            }
        }
        throw new RuntimeException(source_type.format());
    }
}
