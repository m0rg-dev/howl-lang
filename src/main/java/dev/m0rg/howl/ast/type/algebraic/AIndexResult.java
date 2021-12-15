package dev.m0rg.howl.ast.type.algebraic;

import java.util.Set;

public class AIndexResult extends ALambdaTerm implements Applicable {
    ALambdaTerm source;

    public AIndexResult(ALambdaTerm source) {
        this.source = source;
    }

    public String format() {
        return "index " + this.source.format();
    }

    @Override
    public Set<String> freeVariables() {
        return source.freeVariables();
    }

    @Override
    public ALambdaTerm substitute(String from, ALambdaTerm to) {
        return new AIndexResult(source.substitute(from, to));
    }

    @Override
    public boolean isApplicable() {
        return (source instanceof Applicable && ((Applicable) source).isApplicable()) || source instanceof ARawPointer;
    }

    @Override
    public ALambdaTerm apply() {
        if (source instanceof Applicable && ((Applicable) source).isApplicable()) {
            return new AIndexResult(((Applicable) source).apply());
        } else if (source instanceof ARawPointer) {
            return ((ARawPointer) source).source;
        } else {
            throw new RuntimeException();
        }
    }
}
