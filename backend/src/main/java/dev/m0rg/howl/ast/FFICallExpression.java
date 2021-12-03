package dev.m0rg.howl.ast;

public class FFICallExpression extends CallExpressionBase {
    String name;

    public FFICallExpression(Span span, String name) {
        super(span);
        this.name = name;
    }

    public String format() {
        return "fficall " + this.name + this.getArgString();
    }
}
