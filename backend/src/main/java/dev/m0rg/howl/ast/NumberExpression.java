package dev.m0rg.howl.ast;

public class NumberExpression extends Expression {
    String as_text;

    public NumberExpression(Span span, String as_text) {
        super(span);
        this.as_text = as_text;
    }

    @Override
    public ASTElement detach() {
        return new NumberExpression(span, as_text);
    }

    @Override
    public String format() {
        return this.as_text;
    }

    public void transform(ASTTransformer t) {
        ;
    }
}
