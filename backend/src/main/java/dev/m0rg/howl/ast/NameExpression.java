package dev.m0rg.howl.ast;

public class NameExpression extends Expression {
    String name;

    public NameExpression(Span span, String name) {
        super(span);
        this.name = name;
    }

    @Override
    public String format() {
        return this.name;
    }
}
