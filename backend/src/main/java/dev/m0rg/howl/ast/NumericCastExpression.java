package dev.m0rg.howl.ast;

import java.util.HashMap;
import java.util.Map;

import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMValue;

public class NumericCastExpression extends Expression {
    Expression source;
    TypeElement target;

    public NumericCastExpression(Span span) {
        super(span);
    }

    @Override
    public ASTElement detach() {
        NumericCastExpression rc = new NumericCastExpression(span);
        rc.setSource((Expression) source.detach());
        rc.setTarget((TypeElement) target.detach());
        return rc;
    }

    @Override
    public String format() {
        return "((" + target.format() + ") " + source.format() + ")";
    }

    public Expression getSource() {
        return source;
    }

    public void setSource(Expression source) {
        this.source = (Expression) source.setParent(this);
    }

    @Override
    public TypeElement getType() {
        return target;
    }

    public void setTarget(TypeElement target) {
        this.target = (TypeElement) target.setParent(this);
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        rc.put("source", new FieldHandle(() -> this.getSource(), (e) -> this.setSource(e),
                () -> (TypeElement) this.target.detach()));
        return rc;
    }

    public void transform(ASTTransformer t) {
        source.transform(t);
        this.setSource(t.transform(source));
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        return builder.buildTruncOrBitCast(source.generate(builder), target.generate(builder.getModule()), "");
    }
}
