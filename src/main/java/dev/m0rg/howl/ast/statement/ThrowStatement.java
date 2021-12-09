package dev.m0rg.howl.ast.statement;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.llvm.LLVMFunction;
import dev.m0rg.howl.logger.Logger;

public class ThrowStatement extends Statement {
    Expression source;

    public ThrowStatement(Span span) {
        super(span);
    }

    @Override
    public ASTElement detach() {
        ThrowStatement rc = new ThrowStatement(span);
        rc.setSource((Expression) source.detach());
        return rc;
    }

    @Override
    public String format() {
        return "throw " + this.source.format() + ";";
    }

    public void setSource(Expression source) {
        this.source = (Expression) source.setParent(this);
    }

    public void transform(ASTTransformer t) {
        this.source.transform(t);
        this.setSource(t.transform(this.source));
    }

    @Override
    public void generate(LLVMFunction f) {
        Logger.error("skipping throw " + format());
    }
}
