package dev.m0rg.howl.ast.type.iterative;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.type.HasOwnType;

public class FunctionType extends TypeObject implements Distributive {
    Function source;
    TypeObject return_type;
    TypeObject self_type;
    List<TypeObject> args;

    public FunctionType(Function source, Map<Expression, TypeObject> environment) {
        this.source = source;
        this.return_type = new TypeAlias(source.getReturn().deriveType(environment));
        if (source.isStatic()) {
            if (source.getParent() instanceof HasOwnType) {
                this.self_type = new TypeAlias(((HasOwnType) source.getParent()).getOwnType().deriveType(environment));
            } else {
                this.self_type = new ErrorType(null, "static method self on module");
            }
            this.args = source.getArgumentList().stream()
                    .map(x -> (TypeObject) new TypeAlias(x.getOwnType().deriveType(environment))).toList();
        } else {
            this.self_type = new TypeAlias(source.getArgumentList().get(0).getOwnType().deriveType(environment));
            this.args = source.getArgumentList().subList(1, source.getArgumentList().size()).stream()
                    .map(x -> (TypeObject) new TypeAlias(x.getOwnType().deriveType(environment))).toList();
        }
    }

    public FunctionType(Function source, TypeObject return_type, TypeObject self_type, List<TypeObject> args) {
        this.source = source;
        this.return_type = return_type;
        this.self_type = self_type;
        this.args = args;
    }

    public String format() {
        return "fn " + source.getPath() + " = " + return_type.format() + " " + self_type.format() + "("
                + String.join(", ", args.stream().map(x -> x.format()).toList()) + ")";
    }

    @Override
    public boolean anyMatch(ProductionRule r, Map<Expression, TypeObject> environment) {
        return ProductionRule.matches(r, return_type, environment) || ProductionRule.matches(r, self_type, environment)
                || args.stream().anyMatch(x -> ProductionRule.matches(r, x, environment));
    }

    @Override
    public void apply(ProductionRule r, Map<Expression, TypeObject> environment) {
        if (ProductionRule.matches(r, return_type, environment)) {
            return_type = ProductionRule.apply(r, return_type, environment);
        }

        if (ProductionRule.matches(r, self_type, environment)) {
            self_type = ProductionRule.apply(r, self_type, environment);
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
    public boolean isSubstitutable(Map<Expression, TypeObject> environment) {
        return return_type.isSubstitutable(environment) && self_type.isSubstitutable(environment)
                && args.stream().allMatch(x -> x.isSubstitutable(environment));
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
