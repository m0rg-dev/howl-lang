package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMValue;

public class FunctionCallExpression extends CallExpressionBase {
    Expression source;
    boolean resolved;

    public FunctionCallExpression(Span span) {
        super(span);
    }

    @Override
    public ASTElement detach() {
        FunctionCallExpression rc = new FunctionCallExpression(span);
        rc.setSource((Expression) source.detach());
        this.copyArguments(rc);
        rc.resolved = resolved;
        return rc;
    }

    @Override
    public String format() {
        return this.source.format() + this.getArgString();
    }

    public Expression getSource() {
        return source;
    }

    public void setSource(Expression source) {
        this.source = (Expression) source.setParent(this);
    }

    public void transform(ASTTransformer t) {
        source.transform(t);
        this.setSource(t.transform(source));
        this.transformArguments(t);
    }

    @Override
    public TypeElement getType() {
        TypeElement source_type = source.getResolvedType();
        if (source_type instanceof FunctionType) {
            FunctionType ft = (FunctionType) source_type;
            if (ft.isValid()) {
                return ft.getReturnType();
            }
        }
        return super.getType();
    }

    public boolean isResolved() {
        return resolved;
    }

    public void resolve() {
        resolved = true;
    }

    @Override
    protected TypeElement getTypeForArgument(int index) {
        TypeElement source_type = source.getResolvedType();
        if (source_type instanceof FunctionType) {
            FunctionType ft = (FunctionType) source_type;
            if (ft.isValid()) {
                return ft.getArgumentTypes().get(index);
            }
        }
        return new NamedType(span, "__any");
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        rc.put("source",
                new FieldHandle(() -> this.getSource(), (e) -> this.setSource(e), () -> new NamedType(span, "__any")));
        addFields(rc);
        return rc;
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        LLVMValue callee = this.getSource().generate(builder);
        List<LLVMValue> args = new ArrayList<>(this.args.size());
        for (Expression e : this.args) {
            args.add(e.generate(builder));
        }

        return builder.buildCall(callee, args, "");
    }
}
