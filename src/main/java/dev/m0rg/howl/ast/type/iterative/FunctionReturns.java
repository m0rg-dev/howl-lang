package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public class FunctionReturns extends ProductionRule {

    @Override
    boolean matches(TypeObject source, Map<Expression, TypeObject> environment) {
        if (source.dereferenced(environment) instanceof CallType) {
            CallType call = (CallType) source.dereferenced(environment);
            if (call.source.dereferenced(environment) instanceof FunctionType) {
                return true;
            }
        }
        return false;
    }

    @Override
    TypeObject apply(TypeObject source, Map<Expression, TypeObject> environment) {
        if (source.dereferenced(environment) instanceof CallType) {
            CallType call = (CallType) source.dereferenced(environment);
            if (call.source.dereferenced(environment) instanceof FunctionType) {
                return ((FunctionType) call.source.dereferenced(environment)).return_type;
            }
        }
        throw new RuntimeException();
    }

}
