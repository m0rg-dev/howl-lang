package dev.m0rg.howl.ast.expression;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.algebraic.AAnyType;
import dev.m0rg.howl.ast.type.algebraic.AExtractArgument;
import dev.m0rg.howl.ast.type.algebraic.AFunctionReference;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AOverloadType;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMFunction;
import dev.m0rg.howl.llvm.LLVMInstruction;
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

    public boolean isResolved() {
        return resolved;
    }

    public void resolve() {
        resolved = true;
    }

    @Override
    public ALambdaTerm getTypeForArgument(int index) {
        List<ALambdaTerm> arg_types = new ArrayList<>(this.args.size());
        for (Expression e : this.args) {
            arg_types.add(AlgebraicType.derive(e));
        }
        return new AExtractArgument(AlgebraicType.derive(source), arg_types, index);
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
        ALambdaTerm source_type = ALambdaTerm.evaluateFrom(source);
        Logger.trace(this.format());
        if (source_type instanceof AOverloadType) {
            Function source_function = ((AOverloadType) source_type)
                    .select(args.stream().map(x -> ALambdaTerm.evaluateFrom(x)).toList()).get();
            Logger.trace("source function: " + source_function.format());

            if (source instanceof FieldReferenceExpression) {
                FieldReferenceExpression new_source = (FieldReferenceExpression) source.detach();
                new_source.name = source_function.getName();
                new_source.setParent(source.getParent());
                Logger.trace("new source " + new_source.format());

                LLVMValue source_obj = new_source.getSource().generate(builder);

                LLVMValue callee = builder.buildLoad(new_source.getPointerFrom(builder, source_obj), "");

                List<LLVMValue> args = new ArrayList<>(this.args.size());
                if (!source_function.isStatic()) {
                    args.add(source_obj);
                }

                for (Expression e : this.args) {
                    args.add(e.generate(builder));
                }

                LLVMInstruction rc = builder.buildCall(callee, args, "");
                return rc;
            }
        } else if (source_type instanceof AFunctionReference) {
            Function source_function = ((AFunctionReference) source_type).getSource();
            LLVMFunction callee;
            if (builder.getModule().getFunction(source_function.getLLVMPath()).isPresent()) {
                callee = builder.getModule().getFunction(source_function.getLLVMPath()).get();
            } else {
                callee = new LLVMFunction(builder.getModule(), source_function.getLLVMPath(),
                        ((AFunctionReference) source_type).toLLVM(builder.getModule()));
            }
            List<LLVMValue> args = new ArrayList<>(this.args.size());

            for (Expression e : this.args) {
                args.add(e.generate(builder));
            }

            LLVMInstruction rc = builder.buildCall(callee, args, "");
            return rc;
        }
        throw new RuntimeException();
    }
}
