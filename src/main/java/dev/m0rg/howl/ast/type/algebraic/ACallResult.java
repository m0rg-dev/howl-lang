package dev.m0rg.howl.ast.type.algebraic;

import java.util.Map;

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
    public AlgebraicType evaluate(Map<String, AlgebraicType> evalmap) {
        AlgebraicType source_type = source.evaluate(evalmap);
        if (source_type instanceof AFunctionType) {
            return ((AFunctionType) source_type).returntype.evaluate(evalmap);
        } else if (source_type instanceof AAnyType) {
            return source_type;
        }
        Logger.trace("creating error type: attempt to call non-function " + source_type.format());
        return new ABaseType("__error");
    }
}
