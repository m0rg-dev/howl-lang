package dev.m0rg.howl.ast;

public class AssignmentStatement extends Statement {
    Expression lhs;
    Expression rhs;

    public AssignmentStatement(Span span) {
        super(span);
    }

    @Override
    public String format() {
        return this.lhs.format() + " = " + this.rhs.format() + ";";
    }

    public void setLHS(Expression lhs) {
        lhs.assertInsertable();
        this.lhs = (Expression) lhs.setParent(this);
    }

    public void setRHS(Expression rhs) {
        rhs.assertInsertable();
        this.rhs = (Expression) rhs.setParent(this);
    }
}
