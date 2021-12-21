package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public abstract class ProductionRule {
    abstract boolean matches(TypeObject source, Map<Expression, TypeObject> environment);

    abstract TypeObject apply(TypeObject source, Map<Expression, TypeObject> environment);

    public String getName() {
        return this.getClass().getSimpleName();
    }

    public static TypeObject apply(ProductionRule r, TypeObject source, Map<Expression, TypeObject> environment) {
        if (r.matches(source, environment)) {
            return r.apply(source, environment);
        } else if (source instanceof Distributive) {
            Distributive d = (Distributive) source;
            if (d.anyMatch(r, environment)) {
                d.apply(r, environment);
            }
            return source;
        } else {
            throw new RuntimeException();
        }
    }

    public static boolean matches(ProductionRule r, TypeObject source, Map<Expression, TypeObject> environment) {
        if (r.matches(source, environment)) {
            return true;
        }

        if (source instanceof Distributive) {
            Distributive d = (Distributive) source;
            if (d.anyMatch(r, environment)) {
                return true;
            }
        }

        return false;
    }
}
