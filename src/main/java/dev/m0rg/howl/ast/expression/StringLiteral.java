package dev.m0rg.howl.ast.expression;

import java.util.HashMap;
import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.RawPointerType;
import dev.m0rg.howl.ast.type.TypeElement;
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
        rc.setInner(NamedType.build(span, "u8"));
        return rc;
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        return rc;
    }

    public String real_string() {
        return contents
                .substring(1, contents.length() - 1)
                .replaceAll("(?<!\\\\)\\\\n", "\n")
                .replaceAll("(?<!\\\\)\\\\r", "\r");
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        // TODO
        LLVMConstant string = builder.getModule().stringConstant(this.real_string());
        LLVMValue temp = builder.buildAlloca(string.getType(), "");
        builder.buildStore(string, temp);
        return builder.buildBitcast(temp, new LLVMPointerType<LLVMType>(new LLVMIntType(builder.getContext(), 8)), "");
    }
}
