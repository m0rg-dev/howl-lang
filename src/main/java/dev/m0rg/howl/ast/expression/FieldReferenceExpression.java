package dev.m0rg.howl.ast.expression;

import java.util.HashMap;
import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.ClassType;
import dev.m0rg.howl.ast.type.ObjectReferenceType;
import dev.m0rg.howl.ast.type.algebraic.AAnyType;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMPointerType;
import dev.m0rg.howl.llvm.LLVMType;
import dev.m0rg.howl.llvm.LLVMValue;
import dev.m0rg.howl.logger.Logger;

public class FieldReferenceExpression extends Expression implements Lvalue {
    String name;
    Expression source;

    public FieldReferenceExpression(Span span, String name) {
        super(span);
        this.name = name;
    }

    @Override
    public ASTElement detach() {
        FieldReferenceExpression rc = new FieldReferenceExpression(span, name);
        rc.setSource((Expression) source.detach());
        return rc;
    }

    @Override
    public String format() {
        return this.source.format() + "." + this.name;
    }

    public Expression getSource() {
        return source;
    }

    public void setSource(Expression e) {
        this.source = (Expression) e.setParent(this);
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void transform(ASTTransformer t) {
        source.transform(t);
        setSource(t.transform(source));
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        rc.put("source", new FieldHandle(() -> this.getSource(), (e) -> this.setSource(e),
                () -> new AAnyType()));
        return rc;
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        return builder.buildLoad(this.getPointer(builder), "");
    }

    public LLVMValue getPointerFrom(LLVMBuilder builder, LLVMValue source_value) {
        ALambdaTerm source_type = ALambdaTerm.evaluateFrom(source);
        if (source_type instanceof AStructureReference) {
            AStructureReference ct = (AStructureReference) source_type;
            ObjectReferenceType ot = ct.getSource();
            int index = ot.getFieldNames().indexOf(name);
            Logger.trace("index = " + index);
            if (index >= 0) {
                LLVMValue src;

                // object type is always on field 0
                LLVMValue temp = builder.buildAlloca(source_type.toLLVM(builder.getModule()), "");
                builder.buildStore(source_value, temp);
                src = builder.buildLoad(
                        builder.buildStructGEP(source_type.toLLVM(builder.getModule()), temp, 0, ""),
                        "");
                @SuppressWarnings("unchecked")
                LLVMPointerType<LLVMType> t = (LLVMPointerType<LLVMType>) src.getType();
                return builder.buildStructGEP(t.getInner(), src, index, name);
            } else {
                index = ot.getSource().getMethodNames().indexOf(name);
                Logger.trace("index = " + index);
                Logger.trace(String.join(", ", ot.getSource().getMethodNames()));
                LLVMValue src;

                // need to pick 1 or 2 depending on whether we're a class or an interface
                if (ot instanceof ClassType) {
                    LLVMValue temp = builder.buildAlloca(source_type.toLLVM(builder.getModule()), "");
                    builder.buildStore(source_value, temp);
                    src = builder.buildLoad(
                            builder.buildStructGEP(source_type.toLLVM(builder.getModule()), temp, 1, ""),
                            "");
                } else {
                    LLVMValue temp = builder.buildAlloca(source_type.toLLVM(builder.getModule()), "");
                    builder.buildStore(source_value, temp);
                    src = builder.buildLoad(
                            builder.buildStructGEP(source_type.toLLVM(builder.getModule()), temp, 2, ""),
                            "");
                }
                @SuppressWarnings("unchecked")
                LLVMPointerType<LLVMType> t = (LLVMPointerType<LLVMType>) src.getType();
                // offset past RTTI portion of stable
                return builder.buildStructGEP(t.getInner(), src, index + 2, name);
            }
        } else {
            Logger.error("fieldreference of non StructureType " + source.format());
            throw new IllegalStateException();
        }
    }

    @Override
    public LLVMValue getPointer(LLVMBuilder builder) {
        return getPointerFrom(builder, source.generate(builder));
    }
}
