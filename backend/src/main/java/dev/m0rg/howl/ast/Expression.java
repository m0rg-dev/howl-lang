package dev.m0rg.howl.ast;

import java.util.Map;

public abstract class Expression extends ASTElement {
    public Expression(Span span) {
        super(span);
    }

    public TypeElement getType() {
        return new NamedType(this.getSpan(), "__error");
    }

    public TypeElement getResolvedType() {
        return this.getType().resolve();
    }

    public abstract Map<String, FieldHandle> getUpstreamFields();
}
