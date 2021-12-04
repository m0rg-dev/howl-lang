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

    @Override
    public ASTElement detach() {
        AssignmentStatement rc = new AssignmentStatement(span);
        rc.setLHS((Expression) this.lhs.detach());
        rc.setRHS((Expression) this.rhs.detach());
        return rc;
    }

    public void setLHS(Expression lhs) {
        this.lhs = (Expression) lhs.setParent(this);
    }

    public void setRHS(Expression rhs) {
        this.rhs = (Expression) rhs.setParent(this);
    }

    public void transform(ASTTransformer t) {
        this.lhs.transform(t);
        this.setLHS(t.transform(lhs));
        this.rhs.transform(t);
        this.setRHS(t.transform(rhs));
    }
}
