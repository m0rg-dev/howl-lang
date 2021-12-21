package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public class FieldReferenceType extends TypeObject implements Distributive {
    TypeObject source_type;
    String field;

    public FieldReferenceType(TypeObject source_type, String field) {
        this.source_type = source_type;
        this.field = field;
    }

    public String format() {
        return "(" + source_type.format() + ")." + field;
    }

    @Override
    public boolean anyMatch(ProductionRule r, Map<Expression, TypeObject> environment) {
        return r.matches(source_type, environment);
    }

    @Override
    public void apply(ProductionRule r, Map<Expression, TypeObject> environment) {
        source_type = r.apply(source_type, environment);
    }
}
