package dev.m0rg.howl.ast.type.algebraic;

import java.util.HashSet;
import java.util.Set;

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

    static long alpha_counter = 0;

    @Override
    public ALambdaTerm substitute(String from, ALambdaTerm to) {
        if (boundVariable.equals(from)) {
            // (\x.t)[x := r] -> \x.t
            return new ALambda(from, definition);
        } else {
            Set<String> to_vars = to.freeVariables();
            if (to_vars.contains(boundVariable)) {
                String replacement = boundVariable + "_" + alpha_counter;
                alpha_counter++;
                ALambda rc = new ALambda(replacement, definition.substitute(boundVariable, new AVariable(replacement)));
                return rc.substitute(from, to);
            } else {
                // (\y.t)[x := r] -> \y.(t[x := r])
                return new ALambda(boundVariable,
                        definition.substitute(from, to));
            }
        }
    }
}
