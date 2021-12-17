package dev.m0rg.howl.ast.type.algebraic;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

public class AApplication extends ALambdaTerm implements Applicable {
    ALambdaTerm source;
    List<ALambdaTerm> arguments;

    public AApplication(ALambdaTerm source, ALambdaTerm argument) {
        this.source = source;
        this.arguments = Arrays.asList(new ALambdaTerm[] { argument });
    }

    public AApplication(ALambdaTerm source, List<ALambdaTerm> arguments) {
        this.source = source;
        this.arguments = new ArrayList<>(arguments);
    }

    @Override
    public String format() {
        return "(" + source.format() + " " + String.join(", ", arguments.stream().map(x -> x.format()).toList()) + ")";
    }

    @Override
    public Set<String> freeVariables() {
        Set<String> rc = source.freeVariables();
        for (ALambdaTerm argument : arguments) {
            rc.addAll(argument.freeVariables());
        }
        return rc;
    }

    @Override
    public ALambdaTerm substitute(String from, ALambdaTerm to) {
        return new AApplication(source.substitute(from, to),
                arguments.stream().map(x -> x.substitute(from, to)).toList());
    }

    @Override
    public ALambdaTerm apply() {
        if (source instanceof ALambda) {
            ALambda l = (ALambda) source;
            ALambdaTerm rc = l.definition;
            int i = 0;
            for (String boundVariable : l.boundVariables) {
                rc = rc.substitute(boundVariable, arguments.get(i));
                i++;
            }
            return rc;
        } else {
            throw new RuntimeException();
        }
    }
}
