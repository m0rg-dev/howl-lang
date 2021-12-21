package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public class FindVisible extends ProductionRule {
    @Override
    boolean matches(TypeObject source, Map<Expression, TypeObject> environment) {
        if (source instanceof TypeAlias) {
            TypeAlias a = (TypeAlias) source;
            return a.handle instanceof FreeVariable;
        }
        return false;
    }

    @Override
    TypeObject apply(TypeObject source, Map<Expression, TypeObject> environment) {
        if (source instanceof TypeAlias) {
            TypeAlias a = (TypeAlias) source;
            ((FreeVariable) a.handle).visible = true;
        }
        return source;
    }
}
