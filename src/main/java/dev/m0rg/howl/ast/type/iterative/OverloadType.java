package dev.m0rg.howl.ast.type.iterative;

import java.util.List;
import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public class OverloadType extends TypeObject implements Distributive {
    List<TypeObject> source;

    public OverloadType(List<TypeObject> source) {
        this.source = source;
    }

    @Override
    public String format() {
        return "overload (" + String.join(" ∪ ", source.stream().map(x -> x.format()).toList()) + ")";
    }

    @Override
    public boolean isSubstitutable(Map<Expression, TypeObject> environment) {
        return true;
    }

    @Override
    public boolean anyMatch(ProductionRule r, Map<Expression, TypeObject> environment) {
        return source.stream().anyMatch(x -> ProductionRule.matches(r, x, environment));
    }

    @Override
    public void apply(ProductionRule r, Map<Expression, TypeObject> environment) {
        source = source.stream().map(x -> {
            if (ProductionRule.matches(r, x, environment)) {
                return ProductionRule.apply(r, x, environment);
            } else {
                return x;
            }
        }).toList();
    }

    @Override
    public boolean equals(TypeObject other, Map<Expression, TypeObject> environment) {
        return false;
    }

    @Override
    public boolean accepts(TypeObject other, Map<Expression, TypeObject> environment) {
        return this.equals(other, environment);
    }
}
