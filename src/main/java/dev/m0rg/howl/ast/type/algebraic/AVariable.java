package dev.m0rg.howl.ast.type.algebraic;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public class AVariable extends ALambdaTerm {
    static long counter = 0;
    String name;

    public static void reset() {
        counter = 0;
    }

    public AVariable() {
        name = "0";
    }

    public AVariable(String name) {
        this.name = name;
    }

    @Override
    public String format() {
        return "'" + name;
    }

    @Override
    public Set<String> freeVariables() {
        return new HashSet<>(Arrays.asList(new String[] { name }));
    }

    public String getName() {
        return name;
    }

    public ALambda lambda(ALambdaTerm definition) {
        return new ALambda(name, definition);
    }

    @Override
    public ALambdaTerm substitute(String from, ALambdaTerm to) {
        if (name.equals(from)) {
            // x[x := r] -> r
            return to;
        } else {
            // y[x := r] -> y
            return this;
        }
    }

    @Override
    public boolean accepts(ALambdaTerm other) {
        // you can always put something in a free variable
        return true;
    }
}
