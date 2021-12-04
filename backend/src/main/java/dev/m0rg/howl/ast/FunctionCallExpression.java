package dev.m0rg.howl.ast;

public class FunctionCallExpression extends CallExpressionBase {
    Expression source;

    public FunctionCallExpression(Span span) {
        super(span);
    }

    @Override
    public String format() {
        return this.source.format() + this.getArgString();
    }

    public void setSource(Expression source) {
        this.source = (Expression) source.setParent(this);
    }

    public void transform(ASTTransformer t) {
        source.transform(t);
        this.setSource(t.transform(source));
        this.transformArguments(t);
    }
}
