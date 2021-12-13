package dev.m0rg.howl.ast.expression;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.FunctionType;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.ast.type.algebraic.AAnyType;
import dev.m0rg.howl.ast.type.algebraic.ABaseType;
import dev.m0rg.howl.ast.type.algebraic.AFunctionType;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMValue;
import dev.m0rg.howl.logger.Logger;

public class FunctionCallExpression extends CallExpressionBase {
    Expression source;
    boolean resolved;

    // TODO
    public boolean isGeneratedFromThrow = false;

    public FunctionCallExpression(Span span) {
        super(span);
    }

    @Override
    public ASTElement detach() {
        FunctionCallExpression rc = new FunctionCallExpression(span);
        rc.setSource((Expression) source.detach());
        this.copyArguments(rc);
        rc.resolved = resolved;
        rc.isGeneratedFromThrow = isGeneratedFromThrow;
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
        Logger.trace("creating error type (FunctionCallExpression " + source_type.format() + ")");
        return NamedType.build(span, "__error");
    }

    public boolean isResolved() {
        return resolved;
    }

    public void resolve() {
        resolved = true;
    }

    @Override
    protected AlgebraicType getTypeForArgument(int index) {
        AlgebraicType source_type = AlgebraicType.derive(source).evaluate();

        if (source_type instanceof AFunctionType) {
            AFunctionType function_type = (AFunctionType) source_type;
            return function_type.getArgument(index);
        } else if (source_type instanceof AAnyType) {
            // TODO only-for-overloads
            return source_type;
        } else if (source_type instanceof ABaseType && ((ABaseType) source_type).getName().equals("__error")) {
            return source_type;
        } else {
            // throw new RuntimeException(source_type.getClass().getName());
            Logger.trace("creating error type: getTypeForArgument of non-function");
            return new ABaseType("__error");
        }
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        rc.put("source",
                new FieldHandle(() -> this.getSource(), (e) -> this.setSource(e),
                        () -> new AAnyType()));
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
