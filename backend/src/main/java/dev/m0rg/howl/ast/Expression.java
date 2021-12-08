package dev.m0rg.howl.ast;

import java.util.Map;

import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMIntType;
import dev.m0rg.howl.llvm.LLVMUndefinedValue;
import dev.m0rg.howl.llvm.LLVMValue;

public abstract class Expression extends ASTElement {
    public Expression(Span span) {
        super(span);
    }

    public TypeElement getType() {
        return new NamedType(this.getSpan(), "__error");
    }

    public TypeElement getResolvedType() {
        return this.getType().resolve();
    }

    public abstract Map<String, FieldHandle> getUpstreamFields();

    public LLVMValue generate(LLVMBuilder b) {
        return new LLVMUndefinedValue(new LLVMIntType(b.getContext(), 1));
    }

    public Function getContainingFunction() {
        ASTElement p = this.getParent();
        while (!(p instanceof Function))
            p = p.getParent();
        return (Function) p;
    }
}
