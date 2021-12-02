package dev.m0rg.howl.ast;

public class RawPointerType<T extends TypeElement> extends TypeElement {
    T inner;

    public RawPointerType(Span span) {
        super(span);
    }

    @Override
    public String format() {
        return "*" + inner.format();
    }

    @SuppressWarnings("unchecked")
    public RawPointerType<T> setInner(T inner) {
        inner.assertInsertable();
        this.inner = (T) inner.setParent(this);
        return this;
    }
}
