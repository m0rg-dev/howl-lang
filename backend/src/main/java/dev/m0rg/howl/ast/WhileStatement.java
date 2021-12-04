package dev.m0rg.howl.ast;

public class WhileStatement extends Statement {
    Expression condition;
    CompoundStatement body;

    public WhileStatement(Span span) {
        super(span);
    }

    @Override
    public ASTElement detach() {
        WhileStatement rc = new WhileStatement(span);
        rc.setBody((CompoundStatement) body.detach());
        rc.setCondition((Expression) condition.detach());
        return rc;
    }

    @Override
    public String format() {
        return "while " + this.condition.format() + " " + this.body.format();
    }

    public void setCondition(Expression condition) {
        this.condition = (Expression) condition.setParent(this);
    }

    public void setBody(CompoundStatement body) {
        this.body = (CompoundStatement) body.setParent(this);
    }

    public void transform(ASTTransformer t) {
        condition.transform(t);
        this.setCondition(t.transform(condition));
        body.transform(t);
        this.setBody(t.transform(body));
    }
}
