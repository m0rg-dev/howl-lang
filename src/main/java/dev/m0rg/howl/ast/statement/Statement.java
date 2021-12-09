package dev.m0rg.howl.ast.statement;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.llvm.LLVMFunction;

public abstract class Statement extends ASTElement {
    public Statement(Span span) {
        super(span);
    }

    public abstract void generate(LLVMFunction f);

    public Function getContainingFunction() {
        ASTElement p = this.getParent();
        while (!(p instanceof Function))
            p = p.getParent();
        return (Function) p;
    }
}
