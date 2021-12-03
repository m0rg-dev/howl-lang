package dev.m0rg.howl.ast;

public class FunctionCallExpression extends CallExpressionBase {
    Expression source;

    public FunctionCallExpression(Span span) {
        super(span);
    }

    @Override
    public String format() {
        return "new " + this.source.format() + this.getArgString();
    }

    public void setSource(Expression source) {
        source.assertInsertable();
        this.source = (Expression) source.setParent(this);
    }
}
