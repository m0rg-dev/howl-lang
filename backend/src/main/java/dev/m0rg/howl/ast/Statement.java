package dev.m0rg.howl.ast;

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
