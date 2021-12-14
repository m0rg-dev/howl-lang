package dev.m0rg.howl.ast;

import dev.m0rg.howl.ast.type.ObjectReferenceType;

public class Overload extends ASTElement {
    String name;
    ObjectReferenceType source;

    public Overload(Span span, String name, ObjectReferenceType source) {
        super(span);
        this.name = name;
        this.source = source;
    }

    public ObjectCommon getSource() {
        return source.getSource();
    }

    public String getName() {
        return name;
    }

    @Override
    public ASTElement detach() {
        return new Overload(span, name, source);
    }

    @Override
    public String format() {
        return "overload " + name;
    }

    @Override
    public void transform(ASTTransformer t) {
        ;
    }
}
