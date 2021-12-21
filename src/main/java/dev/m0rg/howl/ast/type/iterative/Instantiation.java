package dev.m0rg.howl.ast.type.iterative;

import java.util.List;
import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public class Instantiation extends TypeObject implements Distributive {
    TypeObject source;
    List<TypeObject> contents;

    public Instantiation(TypeObject source, List<TypeObject> contents) {
        this.source = source;
        this.contents = contents;
    }

    public String format() {
        return source.format() + "<" + String.join(", ", contents.stream().map(x -> x.format()).toList()) + ">";
    }

    public boolean equals(TypeObject other) {
        if (other instanceof Instantiation) {
            Instantiation i_other = (Instantiation) other;
            if (!source.equals(i_other.source))
                return false;
            for (int i = 0; i < contents.size(); i++) {
                if (!contents.get(i).equals(i_other.contents.get(i)))
                    return false;
            }
            return true;
        } else {
            return false;
        }
    }

    @Override
    public boolean anyMatch(ProductionRule r, Map<Expression, TypeObject> environment) {
        return r.matches(source, environment) || contents.stream().anyMatch(x -> r.matches(x, environment));
    }

    @Override
    public void apply(ProductionRule r, Map<Expression, TypeObject> environment) {
        if (r.matches(source, environment)) {
            source = r.apply(source, environment);
        }

        contents = contents.stream().map(x -> {
            if (r.matches(x, environment)) {
                return r.apply(x, environment);
            } else {
                return x;
            }
        }).toList();
    }

    @Override
    public boolean isUniquelyDetermined() {
        return source.isUniquelyDetermined() && contents.stream().allMatch(x -> x.isUniquelyDetermined());
    }
}
