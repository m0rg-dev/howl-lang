package dev.m0rg.howl.ast;

public class FFICallExpression extends CallExpressionBase {
    String name;

    public FFICallExpression(Span span, String name) {
        super(span);
        this.name = name;
    }

    @Override
    public ASTElement detach() {
        FFICallExpression rc = new FFICallExpression(span, name);
        this.copyArguments(rc);
        return rc;
    }

    @Override
    public String format() {
        return "fficall " + this.name + this.getArgString();
    }

    public void transform(ASTTransformer t) {
        this.transformArguments(t);
    }
}
