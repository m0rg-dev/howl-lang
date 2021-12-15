package dev.m0rg.howl.ast.expression;

import java.util.HashMap;
import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.algebraic.AAnyType;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMPointerType;
import dev.m0rg.howl.llvm.LLVMType;
import dev.m0rg.howl.llvm.LLVMValue;
import dev.m0rg.howl.logger.Logger;

public class ClassCastExpression extends Expression {
    Expression source;
    ALambdaTerm target;

    public ClassCastExpression(Span span) {
        super(span);
    }

    @Override
    public ASTElement detach() {
        ClassCastExpression rc = new ClassCastExpression(span);
        rc.setSource((Expression) source.detach());
        rc.setTarget(target);
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

    public void setTarget(ALambdaTerm target) {
        this.target = target;
    }

    public ALambdaTerm getTarget() {
        return target;
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        // TODO we use AAnyType here to let us get away with upcasting in
        // ConvertTryCatch - is this reasonable, or should we add a different
        // way to do that upcast and leave this as target type so it
        // sanity-checks?
        rc.put("source", new FieldHandle(() -> this.getSource(), (e) -> this.setSource(e),
                () -> new AAnyType()));
        return rc;
    }

    public void transform(ASTTransformer t) {
        source.transform(t);
        this.setSource(t.transform(source));
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        Logger.trace("CCE" + this.format());
        AStructureReference source_type = (AStructureReference) ALambdaTerm.evaluateFrom(source);
        AStructureReference target_type = (AStructureReference) ALambdaTerm.evaluate(target);
        LLVMType source_llvm = source_type.toLLVM(builder.getModule());
        LLVMType target_llvm = target_type.toLLVM(builder.getModule());

        LLVMValue source_alloca = builder.buildAlloca(source_llvm, "");
        builder.buildStore(source.generate(builder), source_alloca);
        LLVMValue source_object_pointer = builder.buildStructGEP(source_llvm, source_alloca, 0, "");
        LLVMValue source_stable_pointer = builder.buildStructGEP(source_llvm, source_alloca, 1, "");

        LLVMValue target_alloca = builder.buildAlloca(target_llvm, "");
        LLVMValue target_object_pointer = builder.buildStructGEP(target_llvm, target_alloca, 0, "");
        LLVMValue target_stable_pointer = builder.buildStructGEP(target_llvm, target_alloca, 1, "");

        LLVMType source_object_type = source_type.generateObjectType(builder.getModule());
        LLVMType source_stable_type = source_type.generateStaticType(builder.getModule());

        builder.buildStore(builder.buildLoad(source_object_pointer, ""),
                builder.buildBitcast(target_object_pointer,
                        new LLVMPointerType<>(new LLVMPointerType<>(source_object_type)), ""));
        builder.buildStore(builder.buildLoad(source_stable_pointer, ""),
                builder.buildBitcast(target_stable_pointer,
                        new LLVMPointerType<>(new LLVMPointerType<>(source_stable_type)), ""));

        return builder.buildLoad(target_alloca, "as_" + target_type.getSourcePath());
    }
}
