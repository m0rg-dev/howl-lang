package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public class Dereference extends ProductionRule {
    @Override
    boolean matches(TypeObject source, Map<Expression, TypeObject> environment) {
        if (source instanceof TypeAlias) {
            TypeAlias a = (TypeAlias) source;
            return environment.get(a.handle).isSubstitutable(environment);
        }
        return false;
    }

    @Override
    TypeObject apply(TypeObject source, Map<Expression, TypeObject> environment) {
        return environment.get(((TypeAlias) source).handle);
    }
}
