package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public class AnyType extends TypeObject {

    @Override
    public String format() {
        return "*";
    }

    @Override
    public boolean equals(TypeObject other, Map<Expression, TypeObject> environment) {
        return false;
    }

    @Override
    public boolean accepts(TypeObject other, Map<Expression, TypeObject> environment) {
        return true;
    }
}
