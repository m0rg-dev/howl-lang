package dev.m0rg.howl.ast;

public class NamedType extends TypeElement {
    String name;

    public NamedType(Span span, String name) {
        super(span);
        this.name = name;
    }

    @Override
    public String format() {
        return "'" + this.name;
    }

    public void transform(ASTTransformer t) {
        ;
    }
}
