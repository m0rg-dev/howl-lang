package dev.m0rg.howl.ast.expression;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.algebraic.AAnyType;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMPointerType;
import dev.m0rg.howl.llvm.LLVMType;
import dev.m0rg.howl.llvm.LLVMValue;

public class IndexExpression extends Expression implements Lvalue {
    Expression source;
    Expression index;

    public IndexExpression(Span span) {
        super(span);
    }

    @Override
    public ASTElement detach() {
        IndexExpression rc = new IndexExpression(span);
        rc.setSource((Expression) source.detach());
        rc.setIndex((Expression) index.detach());
        return rc;
    }

    @Override
    public String format() {
        return this.source.format() + "[" + this.index.format() + "]";
    }

    public Expression getSource() {
        return source;
    }

    public void setSource(Expression source) {
        this.source = (Expression) source.setParent(this);
    }

    public Expression getIndex() {
        return index;
    }

    public void setIndex(Expression index) {
        this.index = (Expression) index.setParent(this);
    }

    public void transform(ASTTransformer t) {
        source.transform(t);
        this.setSource(t.transform(source));
        index.transform(t);
        this.setIndex(t.transform(index));
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        rc.put("source", new FieldHandle(() -> this.getSource(), (e) -> this.setSource(e),
                () -> new AAnyType()));
        rc.put("index", new FieldHandle(() -> this.getIndex(), (e) -> this.setIndex(e),
                () -> new AAnyType()));
        return rc;
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        return builder.buildLoad(this.getPointer(builder), "");
    }

    @Override
    public LLVMValue getPointer(LLVMBuilder builder) {
        LLVMValue src = source.generate(builder);
        @SuppressWarnings("unchecked")
        LLVMPointerType<LLVMType> t = (LLVMPointerType<LLVMType>) src.getType();
        return builder.buildGEP(t.getInner(), src,
                Arrays.asList(new LLVMValue[] { index.generate(builder) }), "");

    }
}
