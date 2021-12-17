package dev.m0rg.howl.ast.type.algebraic;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class ALambda extends ALambdaTerm {
    List<String> boundVariables;
    ALambdaTerm definition;

    public ALambda(String boundVariable, ALambdaTerm definition) {
        this.boundVariables = Arrays.asList(new String[] { boundVariable });
        this.definition = definition;
    }

    public ALambda(List<String> boundVariables, ALambdaTerm definition) {
        this.boundVariables = new ArrayList<>(boundVariables);
        this.definition = definition;
    }

    @Override
    public String format() {
        return "(λ" + String.join(", ", boundVariables) + " . " + definition.format() + ")";
    }

    @Override
    public Set<String> freeVariables() {
        Set<String> rc = new HashSet<>();
        if (definition instanceof ALambdaTerm) {
            rc.addAll(((ALambdaTerm) definition).freeVariables());
        }
        for (String v : boundVariables) {
            rc.remove(v);
        }
        return rc;
    }

    static long alpha_counter = 0;

    @Override
    public ALambdaTerm substitute(String from, ALambdaTerm to) {
        if (boundVariables.contains(from)) {
            // (\x.t)[x := r] -> \x.t
            return new ALambda(boundVariables, definition);
        } else {
            Set<String> to_vars = to.freeVariables();
            for (String boundVariable : boundVariables) {
                if (to_vars.contains(boundVariable)) {
                    String replacement = boundVariable + "_" + alpha_counter;
                    alpha_counter++;
                    ALambda rc = new ALambda(replacement,
                            definition.substitute(boundVariable, new AVariable(replacement)));
                    return rc.substitute(from, to);
                }
            }
            // (\y.t)[x := r] -> \y.(t[x := r])
            return new ALambda(boundVariables,
                    definition.substitute(from, to));
        }
    }
}
