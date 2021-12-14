package dev.m0rg.howl.ast.type.algebraic;

public class ACallResult extends AlgebraicType {
    AlgebraicType source;

    public ACallResult(AlgebraicType source) {
        this.source = source;
    }

    public String format() {
        return "call " + this.source.format();
    }

    public AlgebraicType getSource() {
        return source;
    }
}
