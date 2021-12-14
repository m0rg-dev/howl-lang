package dev.m0rg.howl.ast.type.algebraic;

import java.util.Set;

public class AExtractArgument extends ALambdaTerm implements Applicable {
    ALambdaTerm source;
    int index;

    public AExtractArgument(ALambdaTerm source, int index) {
        this.source = source;
        this.index = index;
    }

    @Override
    public String format() {
        return "arg " + index + " " + source.format();
    }

    @Override
    public Set<String> freeVariables() {
        return source.freeVariables();
    }

    @Override
    public ALambdaTerm substitute(String from, ALambdaTerm to) {
        return new AExtractArgument(source.substitute(from, to), index);
    }

    @Override
    public ALambdaTerm apply() {
        if (source instanceof AOverloadType) {
            return ((AOverloadType) source).getArgument(index);
        } else if (source instanceof Applicable) {
            return new AExtractArgument(((Applicable) source).apply(), index);
        }
        throw new RuntimeException();
    }
}
