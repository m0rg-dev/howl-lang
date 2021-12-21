package dev.m0rg.howl.ast.expression;

import java.util.HashMap;
import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.iterative.TypeConstant;
import dev.m0rg.howl.ast.type.iterative.TypeObject;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMIntType;
import dev.m0rg.howl.llvm.LLVMValue;

public class NumberExpression extends Expression {
    String as_text;

    public NumberExpression(Span span, String as_text) {
        super(span);
        this.as_text = as_text;
    }

    @Override
    public ASTElement detach() {
        return new NumberExpression(span, as_text);
    }

    @Override
    public String format() {
        return this.as_text;
    }

    public void transform(ASTTransformer t) {
        ;
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        return rc;
    }

    @Override
    public LLVMValue generate(LLVMBuilder b) {
        // TODO
        return (new LLVMIntType(b.getContext(), 64)).getConstant(b.getModule(), Integer.parseInt(as_text, 10));
    }

    @Override
    public void deriveType(Map<Expression, TypeObject> environment) {
        environment.put(this, new TypeConstant("__numeric"));
    }
}
