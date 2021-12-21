package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public class ReferenceFields extends ProductionRule {
    @Override
    boolean matches(TypeObject source, Map<Expression, TypeObject> environment) {
        if (source.dereferenced(environment) instanceof FieldReferenceType) {
            FieldReferenceType as_ref = (FieldReferenceType) source.dereferenced(environment);
            if (as_ref.source_type.dereferenced(environment) instanceof FieldSource) {
                return true;
            }
        }

        return false;
    }

    @Override
    TypeObject apply(TypeObject source, Map<Expression, TypeObject> environment) {
        return ((FieldSource) ((FieldReferenceType) source.dereferenced(environment)).source_type
                .dereferenced(environment)).getField(
                        ((FieldReferenceType) source.dereferenced(environment)).field,
                        environment);
    }

}
