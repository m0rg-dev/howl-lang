package dev.m0rg.howl.ast;

import java.util.HashMap;
import java.util.Map;

public class StringLiteral extends Expression {
    String contents;

    public StringLiteral(Span span, String contents) {
        super(span);
        this.contents = contents;
    }

    public ASTElement detach() {
        return new StringLiteral(this.span, this.contents);
    }

    public String format() {
        return this.contents;
    }

    public void transform(ASTTransformer t) {
        ;
    }

    @Override
    public TypeElement getType() {
        RawPointerType rc = new RawPointerType(span);
        rc.setInner(new NamedType(span, "u8"));
        return rc;
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        return rc;
    }
}
