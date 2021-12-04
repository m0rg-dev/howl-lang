package dev.m0rg.howl.ast;

public class MacroCallExpression extends CallExpressionBase {
    String name;

    public MacroCallExpression(Span span, String name) {
        super(span);
        this.name = name;
    }

    @Override
    public ASTElement detach() {
        MacroCallExpression rc = new MacroCallExpression(span, name);
        copyArguments(rc);
        return rc;
    }

    @Override
    public String format() {
        return "!" + this.name + this.getArgString();
    }

    public void transform(ASTTransformer t) {
        this.transformArguments(t);
    }
}
