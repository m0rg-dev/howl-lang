package dev.m0rg.howl.ast.statement;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.llvm.LLVMFunction;

public class ElseIfStatement extends Statement {
    Expression condition;
    CompoundStatement body;

    public ElseIfStatement(Span span) {
        super(span);
    }

    @Override
    public ASTElement detach() {
        ElseIfStatement rc = new ElseIfStatement(span);
        rc.setBody((CompoundStatement) this.body.detach());
        rc.setCondition((Expression) this.condition.detach());
        return rc;
    }

    @Override
    public String format() {
        return "else if " + this.condition.format() + " " + this.body.format();
    }

    public CompoundStatement getBody() {
        return body;
    }

    public void setBody(CompoundStatement body) {
        this.body = (CompoundStatement) body.setParent(this);
    }

    public Expression getCondition() {
        return condition;
    }

    public void setCondition(Expression condition) {
        this.condition = (Expression) condition.setParent(this);
    }

    public void transform(ASTTransformer t) {
        condition.transform(t);
        this.setCondition(t.transform(condition));
        body.transform(t);
        this.setBody(t.transform(body));
    }

    @Override
    public void generate(LLVMFunction f) {
        throw new UnsupportedOperationException();
    }
}
