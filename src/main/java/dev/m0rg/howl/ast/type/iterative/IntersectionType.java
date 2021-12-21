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
        return r.matches(a, environment) || r.matches(b, environment);
    }

    public void apply(ProductionRule r, Map<Expression, TypeObject> environment) {
        if (r.matches(a, environment))
            a = r.apply(a, environment);

        if (r.matches(b, environment))
            b = r.apply(b, environment);
    }
}
