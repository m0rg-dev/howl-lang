package dev.m0rg.howl.ast.expression;

import java.util.HashMap;
import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.algebraic.ABaseType;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMValue;

public class NumericCastExpression extends Expression {
    Expression source;
    ABaseType target;

    public NumericCastExpression(Span span) {
        super(span);
    }

    @Override
    public ASTElement detach() {
        NumericCastExpression rc = new NumericCastExpression(span);
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

    public ABaseType getTarget() {
        return target;
    }

    public void setTarget(ABaseType target) {
        this.target = target;
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        rc.put("source", new FieldHandle(() -> this.getSource(), (e) -> this.setSource(e),
                () -> target));
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
        ALambdaTerm source_type = ALambdaTerm.evaluateFrom(source);
        if (source_type instanceof ABaseType) {
            source_width = ((ABaseType) source_type).numericWidth().orElse(64);
        }
        if (target instanceof ABaseType) {
            dest_width = ((ABaseType) target).numericWidth().orElse(64);
        }
        if (source_width > dest_width) {
            return builder.buildTrunc(source.generate(builder), target.toLLVM(builder.getModule()), "");
        } else {
            return builder.buildSExt(source.generate(builder), target.toLLVM(builder.getModule()), "");
        }
    }
}
