package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public abstract class ProductionRule {
    abstract boolean matches(TypeObject source, Map<Expression, TypeObject> environment);

    abstract TypeObject apply(TypeObject source, Map<Expression, TypeObject> environment);

    public String getName() {
        return this.getClass().getSimpleName();
    }
}
