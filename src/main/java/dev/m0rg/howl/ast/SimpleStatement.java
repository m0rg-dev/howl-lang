package dev.m0rg.howl.ast;

import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMFunction;

public class SimpleStatement extends Statement {
    Expression expression;

    public SimpleStatement(Span span) {
        super(span);
    }

    @Override
    public ASTElement detach() {
        SimpleStatement rc = new SimpleStatement(span);
        rc.setExpression((Expression) expression.detach());
        return rc;
    }

    @Override
    public String format() {
        return this.expression.format() + ";";
    }

    public void setExpression(Expression expression) {
        this.expression = (Expression) expression.setParent(this);
    }

    public void transform(ASTTransformer t) {
        this.expression.transform(t);
        this.setExpression(t.transform(this.expression));
    }

    @Override
    public void generate(LLVMFunction f) {
        try (LLVMBuilder builder = new LLVMBuilder(f.getModule())) {
            builder.positionAtEnd(f.lastBasicBlock());
            this.expression.generate(builder);
        }
    }
}
