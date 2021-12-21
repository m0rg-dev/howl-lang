package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public class IntersectionType extends TypeObject implements Distributive {
    TypeObject a;
    TypeObject b;

    public IntersectionType(TypeObject a, TypeObject b) {
        this.a = a;
        this.b = b;
    }

    public String format() {
        return "(" + a.format() + " ∩ " + b.format() + ")";
    }

    public boolean anyMatch(ProductionRule r, Map<Expression, TypeObject> environment) {
        return ProductionRule.matches(r, a, environment) || ProductionRule.matches(r, b, environment);
    }

    public void apply(ProductionRule r, Map<Expression, TypeObject> environment) {
        if (ProductionRule.matches(r, a, environment))
            a = ProductionRule.apply(r, a, environment);

        if (ProductionRule.matches(r, b, environment))
            b = ProductionRule.apply(r, b, environment);
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
