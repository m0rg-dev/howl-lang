package dev.m0rg.howl.ast.type.iterative;

import java.util.List;
import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public class OverloadSelect extends TypeObject implements Distributive {
    TypeObject source;
    List<TypeObject> args;

    public OverloadSelect(TypeObject source, List<TypeObject> args) {
        this.source = source;
        this.args = args;
    }

    @Override
    public String format() {
        return "select " + source.format() + " (" + String.join(", ", args.stream().map(x -> x.format()).toList())
                + ")";
    }

    @Override
    public boolean anyMatch(ProductionRule r, Map<Expression, TypeObject> environment) {
        return ProductionRule.matches(r, source, environment)
                || args.stream().anyMatch(x -> ProductionRule.matches(r, x, environment));
    }

    @Override
    public void apply(ProductionRule r, Map<Expression, TypeObject> environment) {
        if (ProductionRule.matches(r, source, environment)) {
            source = ProductionRule.apply(r, source, environment);
        }

        args = args.stream().map(x -> {
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
