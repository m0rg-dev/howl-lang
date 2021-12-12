package dev.m0rg.howl.ast.expression;

import java.util.HashMap;
import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Class;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Interface;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.ClassType;
import dev.m0rg.howl.ast.type.InterfaceType;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMValue;
import dev.m0rg.howl.logger.Logger;

public class GetStaticTableExpression extends Expression {
    Expression source;

    public GetStaticTableExpression(Span span) {
        super(span);
    }

    @Override
    public ASTElement detach() {
        GetStaticTableExpression rc = new GetStaticTableExpression(span);
        rc.setSource((Expression) source.detach());
        return rc;
    }

    @Override
    public String format() {
        return "$(" + this.source.format() + ")";
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
    }

    @Override
    public TypeElement getType() {
        TypeElement source_type = source.getResolvedType();
        if (source_type instanceof ClassType) {
            Class source = ((ClassType) source_type).getSource();
            return source.getStaticType();
        } else if (source_type instanceof InterfaceType) {
            Interface source = ((InterfaceType) source_type).getSource();
            return source.getStaticType();
        } else {
            return NamedType.build(span, "__error");
        }
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        rc.put("source", new FieldHandle(() -> this.getSource(), (e) -> this.setSource(e),
                () -> NamedType.build(this.span, "__any")));
        return rc;
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        TypeElement source_type = source.getResolvedType();
        if (source_type instanceof ClassType) {
            Logger.trace("Loading static table. Source is " + this.source.format());
            LLVMValue src_value = builder.buildAlloca(source_type.generate(builder.getModule()), "");
            builder.buildStore(source.generate(builder), src_value);
            // static table is field 1
            LLVMValue rc = builder.buildLoad(builder.buildStructGEP(
                    this.source.getResolvedType().generate(builder.getModule()),
                    src_value, 1, ""), "");
            return rc;
        } else if (source_type instanceof InterfaceType) {
            Logger.trace("Loading interface table. Source is " + this.source.format());
            LLVMValue src_value = builder.buildAlloca(source_type.generate(builder.getModule()), "");
            builder.buildStore(source.generate(builder), src_value);
            // interface table is field 2
            LLVMValue rc = builder.buildLoad(builder.buildStructGEP(
                    this.source.getResolvedType().generate(builder.getModule()),
                    src_value, 2, ""), "");
            return rc;
        } else {
            throw new IllegalArgumentException();
        }
    }
}
