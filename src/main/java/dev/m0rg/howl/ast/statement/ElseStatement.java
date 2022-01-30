package dev.m0rg.howl.ast.statement;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.llvm.LLVMFunction;

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
        rc.setAnnotation(annotation);
        rc.setBody((CompoundStatement) this.getBody().detach());
        return rc;
    }

    @Override
    public String format() {
        return "ELSE " + this.getBody().format();
    }

    public void setBody(CompoundStatement body) {
        this.body = (CompoundStatement) body.setParent(this);
    }

    public void transform(ASTTransformer t) {
        getBody().transform(t);
        this.setBody(t.transform(getBody()));
    }

    @Override
    public void generate(LLVMFunction f) {
        throw new UnsupportedOperationException();
    }
}
