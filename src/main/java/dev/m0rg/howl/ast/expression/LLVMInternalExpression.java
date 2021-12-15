package dev.m0rg.howl.ast.expression;

import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMValue;

public class LLVMInternalExpression extends Expression {
    LLVMValue value;
    ALambdaTerm type;

    public LLVMInternalExpression(LLVMValue value, ALambdaTerm type) {
        super(null);
        this.value = value;
        this.type = type;
    }

    public ALambdaTerm getType() {
        return type;
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        return value;
    }

    @Override
    public ASTElement detach() {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public String format() {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public void transform(ASTTransformer t) {
        // TODO Auto-generated method stub

    }
}
