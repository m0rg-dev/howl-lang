package dev.m0rg.howl.ast;

public abstract class ASTElement {
    ASTElement parent;
    Span span;

    public ASTElement(Span span) {
        this.span = span;
    }

    public ASTElement setParent(ASTElement parent) {
        if (this.parent == null || this.parent == parent) {
            this.parent = parent;
            return this;
        } else {
            throw new RuntimeException("Attempt to move owned ASTElement");
        }
    }

    public abstract String format();

    public abstract void transform(ASTTransformer t);
}
