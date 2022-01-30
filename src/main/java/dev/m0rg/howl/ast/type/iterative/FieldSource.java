package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public interface FieldSource {
    public TypeObject getField(String name, Map<Expression, TypeObject> environment);
}
