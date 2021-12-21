package dev.m0rg.howl.ast.type.iterative;

public class TypeConstant extends TypeObject {
    String name;

    public TypeConstant(String name) {
        this.name = name;
    }

    @Override
    public String format() {
        return name;
    }

    @Override
    public boolean equals(TypeObject other) {
        if (other instanceof TypeConstant) {
            return ((TypeConstant) other).name.equals(name);
        }
        return false;
    }

    @Override
    public boolean isUniquelyDetermined() {
        return true;
    }
}
