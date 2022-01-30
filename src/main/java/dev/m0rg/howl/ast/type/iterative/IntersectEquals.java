package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public class IntersectEquals extends ProductionRule {

    @Override
    boolean matches(TypeObject source, Map<Expression, TypeObject> environment) {
        if (source.dereferenced(environment) instanceof IntersectionType) {
            IntersectionType it = (IntersectionType) source.dereferenced(environment);
            if (it.a.dereferenced(environment).equals(it.b.dereferenced(environment), environment)) {
                return true;
            }
        }
        return false;
    }

    @Override
    TypeObject apply(TypeObject source, Map<Expression, TypeObject> environment) {
        IntersectionType it = (IntersectionType) source.dereferenced(environment);
        return it.a;
    }

}
