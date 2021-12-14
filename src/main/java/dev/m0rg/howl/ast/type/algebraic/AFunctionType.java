package dev.m0rg.howl.ast.type.algebraic;

import java.util.List;

public abstract class AFunctionType extends ALambdaTerm {
    public abstract ALambdaTerm getReturn(List<ALambdaTerm> argtypes);

    public abstract ALambdaTerm getArgument(int index, List<ALambdaTerm> argtypes);
}
