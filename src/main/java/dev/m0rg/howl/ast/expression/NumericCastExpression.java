package dev.m0rg.howl.ast.expression;

import java.util.HashMap;
import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.NumericType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMValue;

public class NumericCastExpression extends Expression {
    Expression source;
    TypeElement target;

    public NumericCastExpression(Span span) {
        super(span);
    }

    @Override
    public ASTElement detach() {
        NumericCastExpression rc = new NumericCastExpression(span);
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
                () -> AlgebraicType.todo()));
        return rc;
    }

    public void transform(ASTTransformer t) {
        source.transform(t);
        this.setSource(t.transform(source));
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        int source_width = 64;
        int dest_width = 64;
        TypeElement source_type = source.getResolvedType();
        if (source_type instanceof NumericType) {
            source_width = ((NumericType) source_type).getWidth();
        }
        TypeElement dest_type = target.resolve();
        if (dest_type instanceof NumericType) {
            dest_width = ((NumericType) dest_type).getWidth();
        }
        if (source_width > dest_width) {
            return builder.buildTrunc(source.generate(builder), dest_type.generate(builder.getModule()), "");
        } else {
            return builder.buildSExt(source.generate(builder), dest_type.generate(builder.getModule()), "");
        }
    }
}
