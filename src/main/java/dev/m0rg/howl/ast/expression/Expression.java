package dev.m0rg.howl.ast.expression;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.HasUpstreamFields;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMValue;

public abstract class Expression extends ASTElement implements HasUpstreamFields {
    public Expression(Span span) {
        super(span);
    }

    public abstract TypeElement getType();

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
