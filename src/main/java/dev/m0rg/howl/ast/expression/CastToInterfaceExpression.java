package dev.m0rg.howl.ast.expression;

import java.util.HashMap;
import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.ClassType;
import dev.m0rg.howl.ast.type.InterfaceType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.ast.type.algebraic.AAnyType;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMGlobalVariable;
import dev.m0rg.howl.llvm.LLVMPointerType;
import dev.m0rg.howl.llvm.LLVMStructureType;
import dev.m0rg.howl.llvm.LLVMType;
import dev.m0rg.howl.llvm.LLVMValue;

public class CastToInterfaceExpression extends Expression {
    Expression source;
    TypeElement target;

    public CastToInterfaceExpression(Span span) {
        super(span);
    }

    @Override
    public ASTElement detach() {
        CastToInterfaceExpression rc = new CastToInterfaceExpression(span);
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
                () -> new AAnyType()));
        return rc;
    }

    public void transform(ASTTransformer t) {
        source.transform(t);
        this.setSource(t.transform(source));
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        ClassType source_type = (ClassType) source.getResolvedType();
        LLVMValue source_alloca = builder.buildAlloca(source_type.generate(builder.getModule()), "");
        builder.buildStore(source.generate(builder), source_alloca);
        LLVMValue source_object_pointer = builder.buildStructGEP(source_type.generate(builder.getModule()),
                source_alloca, 0,
                "");
        LLVMValue source_stable_pointer = builder.buildStructGEP(source_type.generate(builder.getModule()),
                source_alloca, 1,
                "");
        LLVMValue target_alloca = builder.buildAlloca(this.target.resolve().generate(builder.getModule()), "");
        LLVMValue target_object_pointer = builder.buildStructGEP(this.target.resolve().generate(builder.getModule()),
                target_alloca, 0, "");
        LLVMValue target_stable_pointer = builder.buildStructGEP(this.target.resolve().generate(builder.getModule()),
                target_alloca, 1, "");
        LLVMValue target_itable_pointer = builder.buildStructGEP(this.target.resolve().generate(builder.getModule()),
                target_alloca, 2, "");

        InterfaceType res = (InterfaceType) target.resolve();
        LLVMStructureType itable_type = res.getSource().getStaticType().generate(builder.getModule());
        LLVMGlobalVariable itable = builder.getModule().getOrInsertGlobal(itable_type,
                source_type.getSource().getPath() + "_interface_" + res.getSource().getPath());
        LLVMType source_object_type = source_type.generateObjectType(builder.getModule());
        LLVMType source_stable_type = source_type.getSource().getStaticType().generate(builder.getModule());

        builder.buildStore(builder.buildLoad(source_object_pointer, ""),
                builder.buildBitcast(target_object_pointer,
                        new LLVMPointerType<>(new LLVMPointerType<>(source_object_type)), ""));
        builder.buildStore(builder.buildLoad(source_stable_pointer, ""),
                builder.buildBitcast(target_stable_pointer,
                        new LLVMPointerType<>(new LLVMPointerType<>(source_stable_type)), ""));
        builder.buildStore(itable, target_itable_pointer);
        return builder.buildLoad(target_alloca, "");
    }
}
