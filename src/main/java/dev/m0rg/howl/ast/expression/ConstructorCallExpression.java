package dev.m0rg.howl.ast.expression;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.ClassType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.ast.type.algebraic.AExtractArgument;
import dev.m0rg.howl.ast.type.algebraic.AFieldReferenceType;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMFunction;
import dev.m0rg.howl.llvm.LLVMValue;

public class ConstructorCallExpression extends CallExpressionBase {
    TypeElement source;

    public ConstructorCallExpression(Span span) {
        super(span);
    }

    @Override
    public ASTElement detach() {
        ConstructorCallExpression rc = new ConstructorCallExpression(span);
        rc.setSource((TypeElement) source.detach());
        this.copyArguments(rc);
        return rc;
    }

    @Override
    public String format() {
        return "new " + this.source.format() + this.getArgString();
    }

    public void setSource(TypeElement source) {
        this.source = (TypeElement) source.setParent(this);
    }

    public void transform(ASTTransformer t) {
        source.transform(t);
        this.setSource(t.transform(source));
        this.transformArguments(t);
    }

    @Override
    public TypeElement getType() {
        return source;
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        addFields(rc);
        return rc;
    }

    @Override
    protected ALambdaTerm getTypeForArgument(int index) {
        return new AExtractArgument(new AFieldReferenceType(AlgebraicType.deriveNew(source), "constructor"),
                index + 1);
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        ClassType source_type = (ClassType) source.resolve();
        source_type.getSource().generate(builder.getModule());
        LLVMFunction callee = source_type.getSource().getAllocator(builder.getModule());
        List<LLVMValue> args = new ArrayList<>(this.args.size());
        for (Expression e : this.args) {
            args.add(e.generate(builder));
        }
        return builder.buildCall(callee, args, "");
    }
}
