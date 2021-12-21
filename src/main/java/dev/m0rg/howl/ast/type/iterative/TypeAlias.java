package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public class TypeAlias extends TypeObject implements Distributive {
    Expression handle;

    public TypeAlias(Expression handle) {
        this.handle = handle;
    }

    public String format() {
        return "[" + handle + "]";
    }

    @Override
    public boolean isSubstitutable(Map<Expression, TypeObject> environment) {
        return environment.get(handle).isSubstitutable(environment);
    }

    @Override
    public boolean equals(TypeObject other, Map<Expression, TypeObject> environment) {
        return false;
    }

    @Override
    public boolean accepts(TypeObject other, Map<Expression, TypeObject> environment) {
        return environment.get(handle).accepts(other, environment);
    }

    public boolean anyMatch(ProductionRule r, Map<Expression, TypeObject> environment) {
        return ProductionRule.matches(r, environment.get(handle), environment);
    }

    public void apply(ProductionRule r, Map<Expression, TypeObject> environment) {
        if (ProductionRule.matches(r, environment.get(handle), environment))
            environment.put(handle, ProductionRule.apply(r, environment.get(handle), environment));
    }

    public TypeAlias last_reference(Map<Expression, TypeObject> environment) {
        if (environment.get(handle) instanceof TypeAlias) {
            return ((TypeAlias) environment.get(handle)).last_reference(environment);
        } else {
            return this;
        }
    }
}
