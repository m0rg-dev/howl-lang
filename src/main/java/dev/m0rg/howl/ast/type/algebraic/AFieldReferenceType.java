package dev.m0rg.howl.ast.type.algebraic;

public class AFieldReferenceType extends AlgebraicType {
    AlgebraicType source;
    String name;

    public AFieldReferenceType(AlgebraicType source, String name) {
        this.source = source;
        this.name = name;
    }

    public String format() {
        return this.source.format() + "." + this.name;
    }
}
