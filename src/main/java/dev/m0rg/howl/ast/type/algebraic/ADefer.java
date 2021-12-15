package dev.m0rg.howl.ast.type.algebraic;

import java.util.Set;

import dev.m0rg.howl.ast.type.TypeElement;

public class ADefer extends ALambdaTerm implements Applicable {
    TypeElement t;

    public ADefer(TypeElement t) {
        this.t = t;
    }

    @Override
    public ALambdaTerm apply() {
        return ALambdaTerm.derive(t);
    }

    @Override
    public Set<String> freeVariables() {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public ALambdaTerm substitute(String from, ALambdaTerm to) {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public String format() {
        return "(defer " + t.format() + ")";
    }

}
