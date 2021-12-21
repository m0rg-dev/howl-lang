package dev.m0rg.howl.ast.type.iterative;

import java.util.List;
import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.logger.Logger;

public class Instantiation extends TypeObject implements Distributive, FieldSource {
    TypeObject source;
    List<TypeObject> contents;

    public Instantiation(TypeObject source, List<TypeObject> contents) {
        this.source = source;
        this.contents = contents;
    }

    public String format() {
        return source.format() + "<" + String.join(", ", contents.stream().map(x -> x.format()).toList()) + ">";
    }

    @Override
    public boolean equals(TypeObject other, Map<Expression, TypeObject> environment) {
        return false;
    }

    public boolean accepts(TypeObject other, Map<Expression, TypeObject> environment) {
        if (other.dereferenced(environment) instanceof Instantiation) {
            Instantiation i_other = (Instantiation) other.dereferenced(environment);
            if (!source.accepts(i_other.source, environment)) {
                return false;
            }
            for (int i = 0; i < contents.size(); i++) {
                if (!contents.get(i).dereferenced(environment).equals(i_other.contents.get(i), environment)) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    }

    @Override
    public boolean anyMatch(ProductionRule r, Map<Expression, TypeObject> environment) {
        return ProductionRule.matches(r, source, environment)
                || contents.stream().anyMatch(x -> ProductionRule.matches(r, x, environment));
    }

    @Override
    public void apply(ProductionRule r, Map<Expression, TypeObject> environment) {
        if (ProductionRule.matches(r, source, environment)) {
            source = ProductionRule.apply(r, source, environment);
        }

        contents = contents.stream().map(x -> {
            if (ProductionRule.matches(r, x, environment)) {
                return ProductionRule.apply(r, x, environment);
            } else {
                return x;
            }
        }).toList();
    }

    @Override
    public boolean isSubstitutable(Map<Expression, TypeObject> environment) {
        return source.isSubstitutable(environment)
                && contents.stream().allMatch(x -> x.isSubstitutable(environment));
    }

    @Override
    public TypeObject getField(String name, Map<Expression, TypeObject> environment) {
        if (source.dereferenced(environment) instanceof FieldSource) {
            TypeObject rc = ((FieldSource) source.dereferenced(environment)).getField(name, environment);
            for (int i = 0; i < contents.size(); i++) {
                FreeVariable f = new FreeVariable();
                environment.put(f, rc);
                rc = new ParameterSubstitution(new TypeAlias(f), i, contents.get(i));
            }
            return rc;
        } else {
            return new ErrorType(null, "invalid instantiation");
        }
    }
}
