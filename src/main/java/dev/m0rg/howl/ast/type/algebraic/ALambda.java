package dev.m0rg.howl.ast.type.algebraic;

import java.util.HashSet;
import java.util.Set;

import dev.m0rg.howl.logger.Logger;

public class ALambda extends ALambdaTerm {
    String boundVariable;
    ALambdaTerm definition;

    public ALambda(String boundVariable, ALambdaTerm definition) {
        this.boundVariable = boundVariable;
        this.definition = definition;
    }

    @Override
    public String format() {
        return "(λ" + boundVariable + " . " + definition.format() + ")";
    }

    @Override
    public Set<String> freeVariables() {
        Set<String> rc = new HashSet<>();
        if (definition instanceof ALambdaTerm) {
            rc.addAll(((ALambdaTerm) definition).freeVariables());
        }
        rc.remove(boundVariable);
        return rc;
    }

    @Override
    public ALambdaTerm substitute(String from, ALambdaTerm to) {
        if (boundVariable.equals(from)) {
            // (\x.t)[x := r] -> \x.t
            return new ALambda(from, definition);
        } else {
            Set<String> to_vars = to.freeVariables();
            if (to_vars.contains(boundVariable)) {
                Logger.trace(this.format());
                Logger.trace(to.format());
                throw new RuntimeException(
                        "α-conversion time " + this.format() + "[" + from + " := " + to.format() + "]");
            } else {
                // (\y.t)[x := r] -> \y.(t[x := r])
                return new ALambda(boundVariable,
                        definition.substitute(from, to));
            }
        }
    }
}
