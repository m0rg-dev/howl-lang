package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public interface Distributive {
    public boolean anyMatch(ProductionRule r, Map<Expression, TypeObject> environment);

    public void apply(ProductionRule r, Map<Expression, TypeObject> environment);
}
