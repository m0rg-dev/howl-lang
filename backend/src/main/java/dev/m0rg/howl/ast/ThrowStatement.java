package dev.m0rg.howl.ast;

public class ThrowStatement extends Statement {
    Expression source;

    public ThrowStatement(Span span) {
        super(span);
    }

    @Override
    public String format() {
        return "throw " + this.source.format() + ";";
    }

    public void setSource(Expression source) {
        source.assertInsertable();
        this.source = (Expression) source.setParent(this);
    }
}
