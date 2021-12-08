package dev.m0rg.howl.ast;

import dev.m0rg.howl.llvm.LLVMFunction;

public abstract class Statement extends ASTElement {
    public Statement(Span span) {
        super(span);
    }

    public void generate(LLVMFunction f) {
        // TODO
    }
}
