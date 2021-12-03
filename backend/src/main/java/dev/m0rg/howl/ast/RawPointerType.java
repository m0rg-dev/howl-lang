package dev.m0rg.howl.ast;

public class RawPointerType extends TypeElement {
    TypeElement inner;

    public RawPointerType(Span span) {
        super(span);
    }

    @Override
    public String format() {
        return "*" + inner.format();
    }

    public void setInner(TypeElement inner) {
        this.inner = (TypeElement) inner.setParent(this);
    }

    public void transform(ASTTransformer t) {
        inner.transform(t);
        this.setInner(t.transform(inner));
    }
}
