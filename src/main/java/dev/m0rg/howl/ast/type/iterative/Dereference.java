package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public class Dereference extends ProductionRule {
    @Override
    boolean matches(TypeObject source, Map<Expression, TypeObject> environment) {
        if (source instanceof TypeAlias) {
            TypeAlias a = (TypeAlias) source;
            return environment.get(a.handle).isUniquelyDetermined();
        }
        return false;
    }

    @Override
    TypeObject apply(TypeObject source, Map<Expression, TypeObject> environment) {
        if (((TypeAlias) source).handle instanceof FreeVariable) {
            ((FreeVariable) ((TypeAlias) source).handle).reference_count--;
        }
        return environment.get(((TypeAlias) source).handle);
    }
}
