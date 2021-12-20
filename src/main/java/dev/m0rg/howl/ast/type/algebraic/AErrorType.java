package dev.m0rg.howl.ast.type.algebraic;

import dev.m0rg.howl.ast.Span;

public class AErrorType extends AAnyType {
    public AErrorType(Span where, String message) {
        super();
        if (where != null)
            where.addError(message);
    }
}
