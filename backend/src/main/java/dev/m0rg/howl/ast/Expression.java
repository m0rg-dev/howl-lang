package dev.m0rg.howl.ast;

import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMIntType;
import dev.m0rg.howl.llvm.LLVMUndefinedValue;
import dev.m0rg.howl.llvm.LLVMValue;
import dev.m0rg.howl.logger.Logger;

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

    public LLVMValue generate(LLVMBuilder b) {
        Logger.error("le i1 undef has arrived  " + this.format());
        return new LLVMUndefinedValue(new LLVMIntType(b.getContext(), 1));
    }

    public Function getContainingFunction() {
        ASTElement p = this.getParent();
        while (!(p instanceof Function))
            p = p.getParent();
        return (Function) p;
    }
}
