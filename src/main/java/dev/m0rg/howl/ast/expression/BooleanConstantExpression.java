package dev.m0rg.howl.ast.expression;

import java.util.HashMap;
import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMIntType;
import dev.m0rg.howl.llvm.LLVMValue;

public class BooleanConstantExpression extends Expression {
    boolean value;

    public BooleanConstantExpression(Span span, boolean value) {
        super(span);
        this.value = value;
    }

    @Override
    public ASTElement detach() {
        return new BooleanConstantExpression(span, value);
    }

    @Override
    public String format() {
        return Boolean.toString(value);
    }

    public void transform(ASTTransformer t) {
        ;
    }

    @Override
    public TypeElement getType() {
        return NamedType.build(span, "bool");
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        return rc;
    }

    @Override
    public LLVMValue generate(LLVMBuilder b) {
        return (new LLVMIntType(b.getContext(), 1)).getConstant(b.getModule(), value ? 1 : 0);
    }
}
