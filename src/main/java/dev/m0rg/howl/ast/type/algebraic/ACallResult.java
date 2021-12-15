package dev.m0rg.howl.ast.type.algebraic;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public class ACallResult extends ALambdaTerm implements Applicable {
    ALambdaTerm source;
    List<ALambdaTerm> args;

    public ACallResult(ALambdaTerm source, List<ALambdaTerm> args) {
        this.source = source;
        this.args = args;
    }

    @Override
    public Set<String> freeVariables() {
        return source.freeVariables();
    }

    @Override
    public ALambdaTerm substitute(String from, ALambdaTerm to) {
        return new ACallResult(source.substitute(from, to), args);
    }

    @Override
    public String format() {
        return "call " + source.format();
    }

    @Override
    public ALambdaTerm apply() {
        if (args.stream().anyMatch((a) -> a instanceof Applicable && ((Applicable) a).isApplicable())) {
            List<ALambdaTerm> new_args = new ArrayList<>(args.size());
            for (ALambdaTerm a : args) {
                if (a instanceof Applicable && ((Applicable) a).isApplicable()) {
                    new_args.add(((Applicable) a).apply());
                } else {
                    new_args.add(a);
                }
            }
            return new ACallResult(source, new_args);
        }

        if (source instanceof Applicable && ((Applicable) source).isApplicable()) {
            return new ACallResult(((Applicable) source).apply(), args);
        } else if (source instanceof AFunctionType) {
            return ((AFunctionType) source).getReturn(args);
        }
        throw new RuntimeException();
    }
}
