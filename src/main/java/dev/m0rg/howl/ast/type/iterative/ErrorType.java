package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.expression.Expression;

public class ErrorType extends TypeObject {
    Span source;
    String message;

    public ErrorType(Span source, String message) {
        this.source = source;
        this.message = message;
    }

    public String format() {
        return "∅ (" + message + ")";
    }

    @Override
    public boolean equals(TypeObject other, Map<Expression, TypeObject> environment) {
        return false;
    }

    @Override
    public boolean accepts(TypeObject other, Map<Expression, TypeObject> environment) {
        return this.equals(other, environment);
    }

    @Override
    public boolean isSubstitutable(Map<Expression, TypeObject> environment) {
        return true;
    }
}
