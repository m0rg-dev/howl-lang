package dev.m0rg.howl.ast.type.algebraic;

import java.util.Set;

public class ARawPointer extends ALambdaTerm implements Mangle {
    ALambdaTerm source;

    public ARawPointer(ALambdaTerm source) {
        this.source = source;
    }

    public String format() {
        return "*" + source.format();
    }

    @Override
    public Set<String> freeVariables() {
        return source.freeVariables();
    }

    @Override
    public ALambdaTerm substitute(String from, ALambdaTerm to) {
        return new ARawPointer(source.substitute(from, to));
    }

    @Override
    public boolean accepts(ALambdaTerm other) {
        if (other instanceof ARawPointer) {
            return source.equals(((ARawPointer) other).source);
        } else if (other instanceof AAnyType || other instanceof AVariable) {
            return true;
        } else {
            return false;
        }
    }

    @Override
    public String mangle() {
        if (source instanceof Mangle) {
            return "R" + ((Mangle) source).mangle();
        } else {
            throw new RuntimeException(this.format());
        }
    }
}
