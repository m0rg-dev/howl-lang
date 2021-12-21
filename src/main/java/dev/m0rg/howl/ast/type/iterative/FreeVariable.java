package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMValue;

public class FreeVariable extends Expression {
    long id;
    public int reference_count = 0;
    static long counter = 0;

    public FreeVariable() {
        super(null);
        id = counter;
        counter++;
    }

    public String toString() {
        return "'" + Long.toString(id);
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        return null;
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        return null;
    }

    @Override
    public ASTElement detach() {
        return null;
    }

    @Override
    public String format() {
        return "'" + Long.toString(id);
    }

    @Override
    public void transform(ASTTransformer t) {
    }

}
