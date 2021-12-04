package dev.m0rg.howl.ast;

public class FieldReferenceExpression extends Expression {
    String name;
    Expression source;

    public FieldReferenceExpression(Span span, String name) {
        super(span);
        this.name = name;
    }

    @Override
    public String format() {
        return this.source.format() + "." + this.name;
    }

    public void setSource(Expression e) {
        this.source = (Expression) e.setParent(this);
    }

    public void transform(ASTTransformer t) {
        source.transform(t);
        source = t.transform(source);
    }
}
