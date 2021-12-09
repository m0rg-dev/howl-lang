package dev.m0rg.howl.ast;

import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMValue;

public abstract class Expression extends ASTElement implements HasUpstreamFields {
    public Expression(Span span) {
        super(span);
    }

    public TypeElement getType() {
        return new NamedType(this.getSpan(), "__error");
    }

    public TypeElement getResolvedType() {
        return this.getType().resolve();
    }

    public abstract LLVMValue generate(LLVMBuilder builder);

    public Function getContainingFunction() {
        ASTElement p = this.getParent();
        while (!(p instanceof Function))
            p = p.getParent();
        return (Function) p;
    }
}
