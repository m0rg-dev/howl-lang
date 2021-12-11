package dev.m0rg.howl.ast.expression;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.ClassType;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.TypeElement;
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
    protected TypeElement getTypeForArgument(int index) {
        TypeElement t = source.resolve();
        if (t instanceof ClassType) {
            ClassType source_type = (ClassType) t;
            Optional<Function> constructor = source_type.getSource().getConstructor();
            if (constructor.isPresent()) {
                return constructor.get().getArgumentList().get(index + 1).getOwnType();
            }
        }
        return NamedType.build(this.span, "__error");
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        ClassType source_type = (ClassType) source.resolve();
        source_type.getSource().generate(builder.getModule());
        LLVMFunction callee = source_type.getSource().getAllocator();
        List<LLVMValue> args = new ArrayList<>(this.args.size());
        for (Expression e : this.args) {
            args.add(e.generate(builder));
        }
        return builder.buildCall(callee, args, "");
    }
}
