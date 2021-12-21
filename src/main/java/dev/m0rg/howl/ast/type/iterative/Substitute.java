package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public class Substitute extends ProductionRule {
    @Override
    boolean matches(TypeObject source, Map<Expression, TypeObject> environment) {
        if (source.dereferenced(environment) instanceof ParameterSubstitution) {
            ParameterSubstitution sub = (ParameterSubstitution) source.dereferenced(environment);
            if (sub.source.dereferenced(environment) instanceof FreeParameter) {
                FreeParameter p = (FreeParameter) sub.source.dereferenced(environment);
                return p.index == sub.from;
            } else if (sub.source.dereferenced(environment) instanceof TypeConstant) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    @Override
    TypeObject apply(TypeObject source, Map<Expression, TypeObject> environment) {
        if (source.dereferenced(environment) instanceof ParameterSubstitution) {
            ParameterSubstitution sub = (ParameterSubstitution) source.dereferenced(environment);
            if (sub.source.dereferenced(environment) instanceof FreeParameter) {
                FreeParameter p = (FreeParameter) sub.source.dereferenced(environment);
                if (p.index == sub.from) {
                    return sub.to;
                } else {
                    throw new RuntimeException();
                }
            } else if (sub.source.dereferenced(environment) instanceof TypeConstant) {
                return sub.source;
            } else {
                throw new RuntimeException();
            }
        } else {
            throw new RuntimeException();
        }
    }

}
