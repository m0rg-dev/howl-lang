package dev.m0rg.howl.ast.type.algebraic;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

import dev.m0rg.howl.ast.type.NewType;

public class ANewtype extends ALambdaTerm implements Applicable {
    String name;
    NewType source;

    public ANewtype(NewType source) {
        name = source.getPath();
        this.source = source;
    }

    public ANewtype(NewType source, String name) {
        this.name = name;
        this.source = source;
    }

    @Override
    public String format() {
        return "@" + source.getPath();
    }

    @Override
    public Set<String> freeVariables() {
        return new HashSet<>(Arrays.asList(new String[] { name }));
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
    public ALambdaTerm apply() {
        if (source.isResolved()) {
            return source.getResolution().get();
        } else {
            return new AVariable(name);
        }
    }

    @Override
    public boolean accepts(ALambdaTerm other) {
        if (other instanceof ANewtype) {
            return ((ANewtype) other).name.equals(name);
        } else if (other instanceof AAnyType || other instanceof AVariable) {
            return true;
        } else {
            return false;
        }
    }
}
