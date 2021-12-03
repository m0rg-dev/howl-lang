package dev.m0rg.howl.ast;

public class SimpleStatement extends Statement {
    Expression expression;

    public SimpleStatement(Span span) {
        super(span);
    }

    @Override
    public String format() {
        return this.expression.format() + ";";
    }

    public void setExpression(Expression expression) {
        expression.assertInsertable();
        this.expression = (Expression) expression.setParent(this);
    }
}
