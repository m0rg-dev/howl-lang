package dev.m0rg.howl.ast.expression;

import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.HasUpstreamFields;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.statement.Statement;
import dev.m0rg.howl.ast.type.iterative.ErrorType;
import dev.m0rg.howl.ast.type.iterative.TypeObject;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMValue;

public abstract class Expression extends ASTElement implements HasUpstreamFields {
    TypeObject resolved_type;

    public Expression(Span span) {
        super(span);
    }

    public abstract LLVMValue generate(LLVMBuilder builder);

    public Function getContainingFunction() {
        ASTElement p = this.getParent();
        while (!(p instanceof Function))
            p = p.getParent();
        return (Function) p;
    }

    public Statement nearestStatement() {
        if (this.getParent() instanceof Statement)
            return (Statement) this.getParent();
        return ((Expression) this.getParent()).nearestStatement();
    }

    public TypeObject getResolvedType() {
        return resolved_type;
    }

    public void setResolvedType(TypeObject t) {
        resolved_type = t;
    }

    public void deriveType(Map<Expression, TypeObject> environment) {
        environment.put(this, new ErrorType(span, "can't deriveType " + this.getClass().getName()));
    }
}
