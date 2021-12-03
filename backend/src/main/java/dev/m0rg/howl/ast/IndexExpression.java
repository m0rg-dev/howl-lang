package dev.m0rg.howl.ast;

public class IndexExpression extends Expression {
    Expression source;
    Expression index;

    public IndexExpression(Span span) {
        super(span);
    }

    @Override
    public String format() {
        return this.source.format() + "[" + this.index.format() + "]";
    }

    public void setSource(Expression source) {
        this.source = (Expression) source.setParent(this);
    }

    public void setIndex(Expression index) {
        this.index = (Expression) index.setParent(this);
    }

    public void transform(ASTTransformer t) {
        source.transform(t);
        this.setSource(t.transform(source));
        index.transform(t);
        this.setIndex(t.transform(index));
    }
}
