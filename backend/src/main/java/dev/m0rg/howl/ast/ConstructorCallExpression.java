package dev.m0rg.howl.ast;

public class ConstructorCallExpression extends CallExpressionBase {
    TypeElement source;

    public ConstructorCallExpression(Span span) {
        super(span);
    }

    @Override
    public String format() {
        return "new " + this.source.format() + this.getArgString();
    }

    public void setSource(TypeElement source) {
        this.source = (TypeElement) source.setParent(this);
    }

    public void transform(ASTTransformer t) {
        source.transform(t);
        this.setSource(t.transform(source));
        this.transformArguments(t);
    }
}
