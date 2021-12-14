package dev.m0rg.howl.ast.type.algebraic;

public class AVariable extends ALambdaTerm {
    static long counter = 0;
    String name;

    public static void reset() {
        counter = 0;
    }

    public AVariable() {
        name = Long.toString(counter);
        counter++;
    }

    public AVariable(String name) {
        this.name = name;
    }

    @Override
    public String format() {
        return "'" + name;
    }

    public String getName() {
        return name;
    }

    public ALambda lambda(AlgebraicType definition) {
        return new ALambda(name, definition);
    }
}
