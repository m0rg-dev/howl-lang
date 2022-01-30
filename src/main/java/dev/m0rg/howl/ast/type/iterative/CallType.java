package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public class CallType extends TypeObject implements Distributive {
    TypeObject source;

    public CallType(TypeObject source) {
        this.source = source;
    }

    @Override
    public String format() {
        return "call " + source.format();
    }

    @Override
    public boolean equals(TypeObject other, Map<Expression, TypeObject> environment) {
        // TODO Auto-generated method stub
        return false;
    }

    @Override
    public boolean accepts(TypeObject other, Map<Expression, TypeObject> environment) {
        // TODO Auto-generated method stub
        return false;
    }

    @Override
    public boolean anyMatch(ProductionRule r, Map<Expression, TypeObject> environment) {
        return ProductionRule.matches(r, source, environment);
    }

    @Override
    public void apply(ProductionRule r, Map<Expression, TypeObject> environment) {
        if (ProductionRule.matches(r, source, environment)) {
            source = ProductionRule.apply(r, source, environment);
        }
    }

}
