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
import dev.m0rg.howl.ast.type.algebraic.AFieldReferenceType;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AOverloadType;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;
import dev.m0rg.howl.ast.type.iterative.FieldReferenceType;
import dev.m0rg.howl.ast.type.iterative.FreeVariable;
import dev.m0rg.howl.ast.type.iterative.OverloadSelect;
import dev.m0rg.howl.ast.type.iterative.TypeAlias;
import dev.m0rg.howl.ast.type.iterative.TypeObject;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMFunction;
import dev.m0rg.howl.llvm.LLVMFunctionType;
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
        this.transformArguments(t);
    }

    @Override
    public void deriveType(Map<Expression, TypeObject> environment) {
        // TODO
        TypeAlias source_type = new TypeAlias(source.deriveType(environment));
        FreeVariable constructor_field = new FreeVariable();
        environment.put(constructor_field, new FieldReferenceType(source_type, "constructor"));

        List<TypeObject> args = new ArrayList<>();
        for (Expression e : this.args) {
            e.deriveType(environment);
            args.add(new TypeAlias(e));
        }

        FreeVariable constructor_overload = new FreeVariable();
        environment.put(constructor_overload, new OverloadSelect(new TypeAlias(constructor_field), args));
        environment.put(this, source_type);
    }

    public ALambdaTerm getType() {
        return null;
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
        return null;
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        ALambdaTerm source_type = null;
        String allocator_name = ((AStructureReference) source_type).getPathMangled() + "_alloc";
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
                    .select(args.stream().map(x -> ALambdaTerm.evaluateFrom(x)).toList()).get();
            LLVMFunction constructor;
            if (builder.getModule().getFunction(source_function.getPath()).isPresent()) {
                constructor = builder.getModule().getFunction(source_function.getPath()).get();
            } else {
                constructor = new LLVMFunction(builder.getModule(), source_function.getPath(),
                        constructor_call.getFunction(args.stream().map(x -> ALambdaTerm.evaluateFrom(x)).toList())
                                .toLLVM(builder.getModule()));
            }

            List<LLVMValue> args = new ArrayList<>(this.args.size());
            ClassCastExpression cast = new ClassCastExpression(span);
            cast.setSource(new LLVMInternalExpression(builder.buildLoad(storage, ""), source_type));
            cast.setTarget(ALambdaTerm.evaluateFrom(source_function.getArgumentList().get(0).getOwnType()));
            args.add(cast.generate(builder));
            for (Expression e : this.args) {
                args.add(e.generate(builder));
            }

            builder.buildCall(constructor, args, "");
        }

        return builder.buildLoad(storage, "");
    }
}
