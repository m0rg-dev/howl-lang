package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public abstract class TypeObject {
    public abstract String format();

    public abstract boolean equals(TypeObject other, Map<Expression, TypeObject> environment);

    public abstract boolean accepts(TypeObject other, Map<Expression, TypeObject> environment);

    public boolean isSubstitutable(Map<Expression, TypeObject> environment) {
        return false;
    }

    public TypeObject dereferenced(Map<Expression, TypeObject> environment) {
        if (this instanceof TypeAlias) {
            return environment.get(((TypeAlias) this).handle).dereferenced(environment);
        } else {
            return this;
        }
    }
}
