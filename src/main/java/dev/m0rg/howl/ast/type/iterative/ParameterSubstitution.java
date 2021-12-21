package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public class ParameterSubstitution extends TypeObject implements Distributive {
    TypeObject source;
    int from;
    TypeObject to;

    public ParameterSubstitution(TypeObject source, int from, TypeObject to) {
        this.source = source;
        this.from = from;
        this.to = to;
    }

    @Override
    public String format() {
        return source.format() + "[#" + from + " := " + to.format() + "]";
    }

    @Override
    public boolean anyMatch(ProductionRule r, Map<Expression, TypeObject> environment) {
        return ProductionRule.matches(r, source, environment) || ProductionRule.matches(r, to, environment);
    }

    @Override
    public void apply(ProductionRule r, Map<Expression, TypeObject> environment) {
        if (ProductionRule.matches(r, source, environment)) {
            source = ProductionRule.apply(r, source, environment);
        }

        if (ProductionRule.matches(r, to, environment)) {
            to = ProductionRule.apply(r, to, environment);
        }
    }

    @Override
    public boolean equals(TypeObject other, Map<Expression, TypeObject> environment) {
        return false;
    }

    @Override
    public boolean accepts(TypeObject other, Map<Expression, TypeObject> environment) {
        return this.equals(other, environment);
    }
}
