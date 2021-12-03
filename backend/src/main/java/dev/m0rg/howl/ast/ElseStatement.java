package dev.m0rg.howl.ast;

public class ElseStatement extends Statement {
    CompoundStatement body;

    public ElseStatement(Span span) {
        super(span);
    }

    @Override
    public String format() {
        return "else " + this.body.format();
    }

    public void setBody(CompoundStatement body) {
        body.assertInsertable();
        this.body = (CompoundStatement) body.setParent(this);
    }
}
