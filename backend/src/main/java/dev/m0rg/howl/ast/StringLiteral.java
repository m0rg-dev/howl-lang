package dev.m0rg.howl.ast;

import java.util.HashMap;
import java.util.Map;

import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMConstant;
import dev.m0rg.howl.llvm.LLVMIntType;
import dev.m0rg.howl.llvm.LLVMPointerType;
import dev.m0rg.howl.llvm.LLVMType;
import dev.m0rg.howl.llvm.LLVMValue;

public class StringLiteral extends Expression {
    String contents;

    public StringLiteral(Span span, String contents) {
        super(span);
        this.contents = contents;
    }

    public ASTElement detach() {
        return new StringLiteral(this.span, this.contents);
    }

    public String format() {
        return this.contents;
    }

    public void transform(ASTTransformer t) {
        ;
    }

    @Override
    public TypeElement getType() {
        RawPointerType rc = new RawPointerType(span);
        rc.setInner(new NamedType(span, "u8"));
        return rc;
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        return rc;
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        LLVMConstant string = builder.getModule().stringConstant(contents);
        LLVMValue temp = builder.buildAlloca(string.getType(), "");
        builder.buildStore(string, temp);
        return builder.buildBitcast(temp, new LLVMPointerType<LLVMType>(new LLVMIntType(builder.getContext(), 8)), "");
    }
}
