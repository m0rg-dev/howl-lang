package dev.m0rg.howl.ast.type.iterative;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public class DistributeIntersection extends ProductionRule {

    @Override
    boolean matches(TypeObject source, Map<Expression, TypeObject> environment) {
        if (source.dereferenced(environment) instanceof IntersectionType) {
            IntersectionType i = (IntersectionType) source.dereferenced(environment);
            return i.a.dereferenced(environment) instanceof Instantiation
                    && i.b.dereferenced(environment) instanceof Instantiation;
        }
        return false;
    }

    @Override
    TypeObject apply(TypeObject source, Map<Expression, TypeObject> environment) {
        IntersectionType it = (IntersectionType) source.dereferenced(environment);
        if (it.a.dereferenced(environment) instanceof Instantiation
                && it.b.dereferenced(environment) instanceof Instantiation) {
            Instantiation i_a = (Instantiation) it.a.dereferenced(environment);
            Instantiation i_b = (Instantiation) it.b.dereferenced(environment);

            TypeObject new_source = new IntersectionType(i_a.source, i_b.source);
            List<TypeObject> contents = new ArrayList<>();

            for (int i = 0; i < i_a.contents.size(); i++) {
                contents.add(new IntersectionType(i_a.contents.get(i), i_b.contents.get(i)));
            }
            return new Instantiation(new_source, contents);
        } else {
            throw new RuntimeException();
        }
    }

}
