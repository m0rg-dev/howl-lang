package dev.m0rg.howl.ast;

public class Identifier extends ASTElement {
    private String name;

    public Identifier(Span span, String name) {
        super(span);
        this.setName(name);
    }

    public String getName() {
        return name;
    }

    void setName(String name) {
        this.name = name;
    }

    public String format() {
        return name;
    }
}
