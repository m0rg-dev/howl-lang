package dev.m0rg.howl.ast.type;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.llvm.LLVMModule;
import dev.m0rg.howl.llvm.LLVMPointerType;
import dev.m0rg.howl.llvm.LLVMType;

public class RawPointerType extends TypeElement {
    TypeElement inner;

    public RawPointerType(Span span) {
        super(span);
    }

    @Override
    public ASTElement detach() {
        RawPointerType rc = new RawPointerType(span);
        rc.setInner((TypeElement) inner.detach());
        return rc;
    }

    @Override
    public String format() {
        return "*" + inner.format();
    }

    public TypeElement getInner() {
        return inner;
    }

    public void setInner(TypeElement inner) {
        this.inner = (TypeElement) inner.setParent(this);
    }

    public void transform(ASTTransformer t) {
        inner.transform(t);
        this.setInner(t.transform(inner));
    }

    public String mangle() {
        return "R" + inner.mangle();
    }

    @Override
    public boolean accepts(TypeElement other) {
        if (other instanceof RawPointerType) {
            RawPointerType rpt = (RawPointerType) other;
            return this.inner.accepts(rpt.inner);
        } else {
            return false;
        }
    }

    @Override
    public LLVMType generate(LLVMModule module) {
        return new LLVMPointerType<LLVMType>(this.getInner().resolve().generate(module));
    }
}
