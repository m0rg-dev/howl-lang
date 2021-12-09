package dev.m0rg.howl.ast;

import dev.m0rg.howl.ast.type.TypeElement;

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
