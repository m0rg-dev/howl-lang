package dev.m0rg.howl.ast;

public class IfStatement extends Statement {
    Expression condition;
    CompoundStatement body;

    public IfStatement(Span span) {
        super(span);
    }

    @Override
    public String format() {
        return "if " + this.condition.format() + " " + this.body.format();
    }

    public void setCondition(Expression condition) {
        condition.assertInsertable();
        this.condition = (Expression) condition.setParent(this);
    }

    public void setBody(CompoundStatement body) {
        body.assertInsertable();
        this.body = (CompoundStatement) body.setParent(this);
    }
}
