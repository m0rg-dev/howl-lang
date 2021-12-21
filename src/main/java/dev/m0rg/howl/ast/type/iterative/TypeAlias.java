package dev.m0rg.howl.ast.type.iterative;

import dev.m0rg.howl.ast.expression.Expression;

public class TypeAlias extends TypeObject {
    Expression handle;

    public TypeAlias(Expression handle) {
        this.handle = handle;

        if (handle instanceof FreeVariable) {
            ((FreeVariable) handle).reference_count++;
        }
    }

    public String format() {
        return "[" + handle + "]";
    }
}
