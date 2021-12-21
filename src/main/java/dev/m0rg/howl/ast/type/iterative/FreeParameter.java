package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public class FreeParameter extends TypeObject {
    int index;

    public FreeParameter(int index) {
        this.index = index;
    }

    @Override
    public String format() {
        return "#" + index;
    }

    @Override
    public boolean isSubstitutable(Map<Expression, TypeObject> environment) {
        return true;
    }

    @Override
    public boolean equals(TypeObject other, Map<Expression, TypeObject> environment) {
        if (other.dereferenced(environment) instanceof FreeParameter) {
            return ((FreeParameter) other.dereferenced(environment)).index == index;
        } else {
            return false;
        }
    }

    @Override
    public boolean accepts(TypeObject other, Map<Expression, TypeObject> environment) {
        return this.equals(other, environment);
    }
}
