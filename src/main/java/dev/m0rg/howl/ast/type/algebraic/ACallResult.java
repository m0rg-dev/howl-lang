package dev.m0rg.howl.ast.type.algebraic;

import java.util.List;
import java.util.Set;

import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.Overload;

public class ACallResult extends ALambdaTerm implements Applicable {
    ALambdaTerm source;

    public ACallResult(ALambdaTerm source) {
        this.source = source;
    }

    @Override
    public Set<String> freeVariables() {
        return source.freeVariables();
    }

    @Override
    public ALambdaTerm substitute(String from, ALambdaTerm to) {
        return new ACallResult(source.substitute(from, to));
    }

    @Override
    public String format() {
        return "call " + source.format();
    }

    @Override
    public ALambdaTerm apply() {
        if (source instanceof AOverloadType) {
            return ((AOverloadType) source).getReturn();
        } else if (source instanceof Applicable) {
            return new ACallResult(((Applicable) source).apply());
        } else {
            throw new RuntimeException();
        }
    }
}
