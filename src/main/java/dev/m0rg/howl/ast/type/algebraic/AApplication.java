package dev.m0rg.howl.ast.type.algebraic;

public class AApplication extends ALambdaTerm {
    ALambda function;
    ALambdaTerm argument;

    public AApplication(ALambda function, ALambdaTerm argument) {
        this.function = function;
        this.argument = argument;
    }

    @Override
    public String format() {
        return this.function.format() + "[" + this.argument.format() + "]";
    }
}
