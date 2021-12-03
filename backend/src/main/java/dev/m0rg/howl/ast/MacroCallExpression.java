package dev.m0rg.howl.ast;

public class MacroCallExpression extends CallExpressionBase {
    String name;

    public MacroCallExpression(Span span, String name) {
        super(span);
        this.name = name;
    }

    public String format() {
        return "!" + this.name + this.getArgString();
    }
}
