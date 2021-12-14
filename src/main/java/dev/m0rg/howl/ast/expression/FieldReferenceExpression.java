package dev.m0rg.howl.ast.expression;

import java.util.HashMap;
import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.ClassType;
import dev.m0rg.howl.ast.type.StructureType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.ast.type.algebraic.AAnyType;
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

    @Override
    public LLVMValue getPointer(LLVMBuilder builder) {
        TypeElement source_type = null; // source.getResolvedType();
        if (source_type instanceof StructureType) {
            StructureType ct = (StructureType) source_type;
            int index = ct.getFieldNames().indexOf(name);
            LLVMValue src;

            if (source_type instanceof ClassType) {
                LLVMValue temp = builder.buildAlloca(source_type.generate(builder.getModule()), "");
                builder.buildStore(source.generate(builder), temp);
                src = builder.buildLoad(builder.buildStructGEP(source_type.generate(builder.getModule()), temp, 0, ""),
                        "");
            } else {
                src = source.generate(builder);
            }
            @SuppressWarnings("unchecked")
            LLVMPointerType<LLVMType> t = (LLVMPointerType<LLVMType>) src.getType();
            LLVMValue rc = builder.buildStructGEP(t.getInner(), src, index, name);

            return rc;
        } else {
            Logger.error("fieldreference of non StructureType " + source.format());
            throw new IllegalStateException();
        }
    }
}
