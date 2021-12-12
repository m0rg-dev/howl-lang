package dev.m0rg.howl.ast.expression;

import java.util.HashMap;
import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.ast.type.algebraic.AAnyType;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMValue;

public class TemporaryExpression extends Expression {
    static int counter = 0;

    Expression source;
    int index;
    boolean generated = false;
    LLVMValue storage;

    public TemporaryExpression(Span span) {
        super(span);
        index = counter++;
    }

    TemporaryExpression(TemporaryExpression other) {
        super(other.getSpan());
        index = other.index;
    }

    @Override
    public ASTElement detach() {
        TemporaryExpression rc = new TemporaryExpression(this);
        rc.setSource((Expression) source.detach());
        return rc;
    }

    @Override
    public String format() {
        return "T%" + index + " /* = " + source.format() + " */";
    }

    @Override
    public void transform(ASTTransformer t) {
        this.source.transform(t);
        this.setSource(t.transform(source));
    }

    public Expression getSource() {
        return source;
    }

    public void setSource(Expression source) {
        this.source = (Expression) source.setParent(this);
    }

    @Override
    public TypeElement getType() {
        return source.getType();
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        rc.put("source", new FieldHandle(() -> this.getSource(), (e) -> this.setSource(e),
                () -> new AAnyType()));
        return rc;
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        if (this.generated)
            return builder.buildLoad(this.storage, "");
        this.storage = builder.buildAlloca(this.getType().resolve().generate(builder.getModule()), "temp_" + index);
        builder.buildStore(source.generate(builder), storage);
        this.generated = true;
        return builder.buildLoad(this.storage, "");
    }
}
