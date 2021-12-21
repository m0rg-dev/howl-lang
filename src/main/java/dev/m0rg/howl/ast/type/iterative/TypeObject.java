package dev.m0rg.howl.ast.type.iterative;

public abstract class TypeObject {
    public abstract String format();

    public boolean equals(TypeObject other) {
        return false;
    }

    public boolean accepts(TypeObject other) {
        return false;
    }

    public boolean isUniquelyDetermined() {
        return false;
    }
}
