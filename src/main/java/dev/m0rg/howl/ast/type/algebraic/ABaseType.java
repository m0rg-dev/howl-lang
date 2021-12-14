package dev.m0rg.howl.ast.type.algebraic;

import java.util.HashSet;
import java.util.Set;

public class ABaseType extends ALambdaTerm {
    String name;

    public ABaseType(String name) {
        this.name = name;
    }

    public String format() {
        return "#" + name;
    }

    public String getName() {
        return name;
    }

    public Set<String> freeVariables() {
        return new HashSet<>();
    }

    public ALambdaTerm substitute(String from, ALambdaTerm to) {
        return this;
    }
}
