package dev.m0rg.howl.ast.type.algebraic;

public interface Applicable {
    public default boolean isApplicable() {
        return true;
    }

    public ALambdaTerm apply();
}
