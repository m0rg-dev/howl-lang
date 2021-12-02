package dev.m0rg.howl.ast;

public class Placeholder extends ASTElement {
    public Placeholder(Span span) {
        super(span);
    }

    public String format() {
        return "/* placeholder */";
    }
}
