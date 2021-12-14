package dev.m0rg.howl.ast.type.algebraic;

import java.util.HashSet;
import java.util.Set;

public class AAnyType extends ALambdaTerm {
    public String format() {
        return "Any";
    }

    public Set<String> freeVariables() {
        return new HashSet<>();
    }

    public ALambdaTerm substitute(String from, ALambdaTerm to) {
        return this;
    }
}
