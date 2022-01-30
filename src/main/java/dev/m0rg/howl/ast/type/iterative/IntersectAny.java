package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public class IntersectAny extends ProductionRule {

    @Override
    boolean matches(TypeObject source, Map<Expression, TypeObject> environment) {
        if (source.dereferenced(environment) instanceof IntersectionType) {
            IntersectionType it = (IntersectionType) source.dereferenced(environment);
            if (it.a.dereferenced(environment) instanceof AnyType
                    || it.b.dereferenced(environment) instanceof AnyType) {
                return true;
            }
        }
        return false;
    }

    @Override
    TypeObject apply(TypeObject source, Map<Expression, TypeObject> environment) {
        IntersectionType it = (IntersectionType) source.dereferenced(environment);
        if (it.a.dereferenced(environment) instanceof AnyType)
            return it.b;
        if (it.b.dereferenced(environment) instanceof AnyType)
            return it.a;
        throw new RuntimeException();
    }

}
