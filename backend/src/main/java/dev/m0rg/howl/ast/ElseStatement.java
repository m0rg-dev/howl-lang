package dev.m0rg.howl.ast;

public class ElseStatement extends Statement {
    CompoundStatement body;

    public ElseStatement(Span span) {
        super(span);
    }

    @Override
    public ASTElement detach() {
        ElseStatement rc = new ElseStatement(span);
        rc.setBody((CompoundStatement) this.body.detach());
        return rc;
    }

    @Override
    public String format() {
        return "else " + this.body.format();
    }

    public void setBody(CompoundStatement body) {
        this.body = (CompoundStatement) body.setParent(this);
    }

    public void transform(ASTTransformer t) {
        body.transform(t);
        this.setBody(t.transform(body));
    }
}
