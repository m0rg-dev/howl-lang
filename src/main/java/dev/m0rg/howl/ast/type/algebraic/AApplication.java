package dev.m0rg.howl.ast.type.algebraic;

import java.util.Set;

public class AApplication extends ALambdaTerm implements Applicable {
    ALambdaTerm source;
    ALambdaTerm argument;

    public AApplication(ALambdaTerm source, ALambdaTerm argument) {
        this.source = source;
        this.argument = argument;
    }

    @Override
    public String format() {
        return "(" + source.format() + " " + argument.format() + ")";
    }

    @Override
    public Set<String> freeVariables() {
        Set<String> rc = source.freeVariables();
        rc.addAll(argument.freeVariables());
        return rc;
    }

    @Override
    public ALambdaTerm substitute(String from, ALambdaTerm to) {
        return new AApplication(source.substitute(from, to), argument.substitute(from, to));
    }

    @Override
    public ALambdaTerm apply() {
        if (source instanceof ALambda) {
            ALambda l = (ALambda) source;
            return l.definition.substitute(l.boundVariable, argument);
        } else {
            throw new RuntimeException();
        }
    }
}
