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
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.ast.type.algebraic.AExtractArgument;
import dev.m0rg.howl.ast.type.algebraic.AFieldReferenceType;
import dev.m0rg.howl.ast.type.algebraic.AFunctionReference;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AOverloadType;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMFunction;
import dev.m0rg.howl.llvm.LLVMFunctionType;
import dev.m0rg.howl.llvm.LLVMInstruction;
import dev.m0rg.howl.llvm.LLVMPointerType;
import dev.m0rg.howl.llvm.LLVMValue;
import dev.m0rg.howl.logger.Logger;

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
    public ALambdaTerm getTypeForArgument(int index) {
        List<ALambdaTerm> arg_types = new ArrayList<>(this.args.size());

        for (Expression e : this.args) {
            arg_types.add(AlgebraicType.derive(e));
        }
        return new AExtractArgument(new AFieldReferenceType(AlgebraicType.derive(source), "constructor"),
                arg_types, index);
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        ALambdaTerm source_type = ALambdaTerm.evaluateFrom(source);
        Logger.trace("Generating constructor call: " + source_type.format());
        String allocator_name = ((AStructureReference) source_type).getSourcePath() + "_alloc";
        LLVMFunctionType allocator_type = new LLVMFunctionType(
                source_type.toLLVM(builder.getModule()),
                new ArrayList<>());
        LLVMFunction allocator;
        if (builder.getModule().getFunction(allocator_name).isPresent()) {
            allocator = builder.getModule().getFunction(allocator_name).get();
        } else {
            allocator = new LLVMFunction(builder.getModule(), allocator_name, allocator_type);
        }

        LLVMValue storage = builder.buildAlloca(source_type.toLLVM(builder.getModule()), "");
        builder.buildStore(builder.buildCall(allocator, new ArrayList<>(), ""), storage);

        if (((AStructureReference) source_type).getSource().getSource().getOverloadCandidates("constructor")
                .size() > 0) {
            AOverloadType constructor_call = (AOverloadType) ALambdaTerm
                    .evaluate(new AFieldReferenceType(source_type, "constructor"));
            Function source_function = constructor_call
                    .select(args.stream().map(x -> ALambdaTerm.evaluateFrom(x)).toList());
            Function source_function_two = ((AStructureReference) source_type).getSourceResolved().getSource()
                    .getMethod(source_function.getName()).get();
            LLVMFunction constructor;
            if (builder.getModule().getFunction(source_function_two.getPath()).isPresent()) {
                constructor = builder.getModule().getFunction(source_function_two.getPath()).get();
            } else {
                constructor = new LLVMFunction(builder.getModule(), source_function_two.getPath(),
                        constructor_call.getFunction(args.stream().map(x -> ALambdaTerm.evaluateFrom(x)).toList())
                                .toLLVM(builder.getModule()));
            }

            List<LLVMValue> args = new ArrayList<>(this.args.size());
            args.add(builder.buildLoad(storage, ""));
            for (Expression e : this.args) {
                args.add(e.generate(builder));
            }

            builder.buildCall(constructor, args, "");
        }

        return builder.buildLoad(storage, "");
    }
}
