package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.NumericType;

public class IntersectNumeric extends ProductionRule {
    @Override
    boolean matches(TypeObject source, Map<Expression, TypeObject> environment) {
        if (source.dereferenced(environment) instanceof IntersectionType) {
            IntersectionType it = (IntersectionType) source.dereferenced(environment);
            if (it.a.dereferenced(environment) instanceof TypeConstant
                    && it.b.dereferenced(environment) instanceof TypeConstant) {
                NamedType t = NamedType.build(null, ((TypeConstant) it.a.dereferenced(environment)).name);
                NamedType u = NamedType.build(null, ((TypeConstant) it.b.dereferenced(environment)).name);
                return t instanceof NumericType && u instanceof NumericType;
            }
        }
        return false;
    }

    @Override
    TypeObject apply(TypeObject source, Map<Expression, TypeObject> environment) {
        IntersectionType it = (IntersectionType) source.dereferenced(environment);
        NumericType t = (NumericType) NamedType.build(null, ((TypeConstant) it.a.dereferenced(environment)).name);
        NumericType u = (NumericType) NamedType.build(null, ((TypeConstant) it.b.dereferenced(environment)).name);

        return new TypeConstant(t.intersect(u).getName(), ((TypeConstant) it.b.dereferenced(environment)).source);
    }
}
