package dev.m0rg.howl.ast.type.algebraic;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public class AExtractArgument extends ALambdaTerm implements Applicable {
    ALambdaTerm source;
    List<ALambdaTerm> args;
    int index;

    public AExtractArgument(ALambdaTerm source, List<ALambdaTerm> args, int index) {
        this.source = source;
        this.index = index;
        this.args = args;
    }

    @Override
    public String format() {
        List<String> afmt = new ArrayList<>();
        for (ALambdaTerm a : this.args) {
            afmt.add(a.format());
        }
        return "arg " + index + " " + source.format() + " {" + String.join(", ", afmt) + "}";
    }

    @Override
    public Set<String> freeVariables() {
        return source.freeVariables();
    }

    @Override
    public ALambdaTerm substitute(String from, ALambdaTerm to) {
        return new AExtractArgument(source.substitute(from, to), args, index);
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
            return new AExtractArgument(source, new_args, index);
        }

        if (source instanceof Applicable && ((Applicable) source).isApplicable()) {
            return new AExtractArgument(((Applicable) source).apply(), args, index);
        } else if (source instanceof AOverloadType) {
            return ((AOverloadType) source).getArgument(index, args);
        }
        throw new RuntimeException();
    }
}
