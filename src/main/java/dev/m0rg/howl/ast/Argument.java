package dev.m0rg.howl.ast;

public class Argument extends Field {
    public Argument(Span span, String name) {
        super(span, name);
    }

    @Override
    public ASTElement detach() {
        Argument rc = new Argument(span, name);
        rc.setType((TypeElement) fieldtype.detach());
        return rc;
    }
}
