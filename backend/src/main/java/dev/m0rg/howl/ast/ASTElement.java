package dev.m0rg.howl.ast;

public abstract class ASTElement {
    ASTElement parent;
    Span span;

    public ASTElement(Span span) {
        this.span = span;
    }

    public boolean isOwned() {
        return this.parent != null;
    }

    public ASTElement setParent(ASTElement parent) {
        this.parent = parent;
        return this;
    }

    public void assertInsertable() {
        if (this.isOwned()) {
            throw new IllegalArgumentException("Attempted to move owned element");
        }
    }

    public abstract String format();
}
