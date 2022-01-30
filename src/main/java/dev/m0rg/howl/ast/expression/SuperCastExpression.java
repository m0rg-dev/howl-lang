package dev.m0rg.howl.ast.expression;

import java.util.HashMap;
import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.ClassType;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMGlobalVariable;
import dev.m0rg.howl.llvm.LLVMPointerType;
import dev.m0rg.howl.llvm.LLVMStructureType;
import dev.m0rg.howl.llvm.LLVMType;
import dev.m0rg.howl.llvm.LLVMValue;

public class SuperCastExpression extends Expression {
    public SuperCastExpression(Span span) {
        super(span);
    }

    @Override
    public ASTElement detach() {
        return new SuperCastExpression(span);
    }

    @Override
    public String format() {
        return "super";
    }

    @Override
    public void transform(ASTTransformer t) {
        ;
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        return new HashMap<>();
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        Expression source = (Expression) new NameExpression(span, "self").setParent(this);
        NamedType target = this.nearestObject().get().getExtends().get();

        AStructureReference source_type = (AStructureReference) ALambdaTerm.evaluateFrom(source);
        AStructureReference target_type = (AStructureReference) ALambdaTerm.evaluateFrom(target);
        LLVMType source_llvm = source_type.toLLVM(builder.getModule());
        LLVMType target_llvm = target_type.toLLVM(builder.getModule());

        LLVMValue source_alloca = builder.buildAlloca(source_llvm, "");
        builder.buildStore(source.generate(builder), source_alloca);

        LLVMValue source_object_pointer = builder.buildStructGEP(source_llvm, source_alloca, 0, "");

        LLVMValue target_alloca = builder.buildAlloca(target_llvm, "");
        LLVMValue target_object_pointer = builder.buildStructGEP(target_llvm, target_alloca, 0, "");
        LLVMValue target_stable_pointer = builder.buildStructGEP(target_llvm, target_alloca, 1, "");

        LLVMStructureType stable_type = target_type
                .generateStaticType(builder.getModule());
        LLVMGlobalVariable stable = builder.getModule().getOrInsertGlobal(stable_type,
                target_type.getPathMangled() + "_static");
        LLVMType source_object_type = source_type.generateObjectType(builder.getModule());

        builder.buildStore(builder.buildLoad(source_object_pointer, ""),
                builder.buildBitcast(target_object_pointer,
                        new LLVMPointerType<>(new LLVMPointerType<>(source_object_type)), ""));
        builder.buildStore(stable, target_stable_pointer);
        return builder.buildLoad(target_alloca, "");
    }

}
