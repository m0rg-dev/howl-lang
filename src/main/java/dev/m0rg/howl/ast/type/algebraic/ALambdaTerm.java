package dev.m0rg.howl.ast.type.algebraic;

import java.util.Set;

public abstract class ALambdaTerm extends AlgebraicType {
    public abstract Set<String> freeVariables();

    public abstract ALambdaTerm substitute(String from, ALambdaTerm to);
}
