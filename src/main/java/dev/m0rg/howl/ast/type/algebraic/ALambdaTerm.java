package dev.m0rg.howl.ast.type.algebraic;

import java.util.Set;

import dev.m0rg.howl.logger.Logger;

public abstract class ALambdaTerm extends AlgebraicType {
    public abstract Set<String> freeVariables();

    public abstract ALambdaTerm substitute(String from, ALambdaTerm to);

    public static ALambdaTerm evaluate(ALambdaTerm t) {
        // Logger.trace("evaluate: " + t.format());
        while (t instanceof Applicable) {
            t = ((Applicable) t).apply();
            // Logger.trace(" => " + t.format());
        }
        return t;
    }
}
