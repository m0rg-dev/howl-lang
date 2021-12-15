package dev.m0rg.howl.ast;

import java.util.function.Function;

public class Finder {
    public static void find(ASTElement source, Function<ASTElement, Boolean> predicate) {
        if (predicate.apply(source)) {
            return;
        }

        if (source instanceof Walkable) {
            ((Walkable) source).getContents().stream().forEach(x -> find(x, predicate));
        } else {
            throw new UnsupportedOperationException("find " + source.getClass().getName());
        }
    }
}
