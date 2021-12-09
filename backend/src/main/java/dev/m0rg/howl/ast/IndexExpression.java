package dev.m0rg.howl.ast;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMPointerType;
import dev.m0rg.howl.llvm.LLVMType;
import dev.m0rg.howl.llvm.LLVMValue;

public class IndexExpression extends Expression {
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
    public TypeElement getType() {
        TypeElement source_type = source.getResolvedType();
        if (source_type instanceof RawPointerType) {
            RawPointerType as_ptr = (RawPointerType) source_type;
            return as_ptr.getInner();
        } else {
            return NamedType.build(span, "__error");
        }
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        rc.put("source", new FieldHandle(() -> this.getSource(), (e) -> this.setSource(e),
                () -> new NamedType(this.span, "__any")));
        rc.put("index", new FieldHandle(() -> this.getIndex(), (e) -> this.setIndex(e),
                () -> new NamedType(this.span, "__numeric")));
        return rc;
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        LLVMValue src = source.generate(builder);
        @SuppressWarnings("unchecked")
        LLVMPointerType<LLVMType> t = (LLVMPointerType<LLVMType>) src.getType();
        return builder.buildLoad(builder.buildGEP(t.getInner(), src,
                Arrays.asList(new LLVMValue[] { index.generate(builder) }), ""), "");

    }
}
