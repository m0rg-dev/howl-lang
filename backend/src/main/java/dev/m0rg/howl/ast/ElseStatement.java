package dev.m0rg.howl.ast;

public class ElseStatement extends Statement {
    private CompoundStatement body;

    public ElseStatement(Span span) {
        super(span);
    }

    public CompoundStatement getBody() {
        return body;
    }

    @Override
    public ASTElement detach() {
        ElseStatement rc = new ElseStatement(span);
        rc.setBody((CompoundStatement) this.getBody().detach());
        return rc;
    }

    @Override
    public String format() {
        return "else " + this.getBody().format();
    }

    public void setBody(CompoundStatement body) {
        this.body = (CompoundStatement) body.setParent(this);
    }

    public void transform(ASTTransformer t) {
        getBody().transform(t);
        this.setBody(t.transform(getBody()));
    }
}
