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
        inner.assertInsertable();
        this.inner = (TypeElement) inner.setParent(this);
    }
}
