package dev.m0rg.howl.ast.statement;

import java.util.HashMap;
import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.HasUpstreamFields;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.expression.Lvalue;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMFunction;

public class AssignmentStatement extends Statement implements HasUpstreamFields {
    private Expression lhs;
    private Expression rhs;

    public AssignmentStatement(Span span) {
        super(span);
    }

    public Expression getRHS() {
        return rhs;
    }

    public Expression getLHS() {
        return lhs;
    }

    @Override
    public String format() {
        return this.getLHS().format() + " = " + this.getRHS().format() + ";";
    }

    @Override
    public ASTElement detach() {
        AssignmentStatement rc = new AssignmentStatement(span);
        rc.setLHS((Expression) this.getLHS().detach());
        rc.setRHS((Expression) this.getRHS().detach());
        return rc;
    }

    public void setLHS(Expression lhs) {
        this.lhs = (Expression) lhs.setParent(this);
    }

    public void setRHS(Expression rhs) {
        this.rhs = (Expression) rhs.setParent(this);
    }

    public void transform(ASTTransformer t) {
        this.getLHS().transform(t);
        this.setLHS(t.transform(getLHS()));
        this.getRHS().transform(t);
        this.setRHS(t.transform(getRHS()));
    }

    @Override
    public void generate(LLVMFunction f) {
        if (this.getLHS() instanceof Lvalue) {
            Lvalue l = (Lvalue) this.getLHS();
            try (LLVMBuilder builder = new LLVMBuilder(f.getModule())) {
                builder.positionAtEnd(f.lastBasicBlock());
                builder.buildStore(this.getRHS().generate(builder), l.getPointer(builder));
            }
        } else {
            throw new IllegalArgumentException("assign to non-lvalue " + this.getLHS().format());
        }
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        Map<String, FieldHandle> rc = new HashMap<>();
        rc.put("rhs",
                new FieldHandle(() -> this.getRHS(), (e) -> this.setRHS(e), () -> AlgebraicType.derive(this.getLHS())));
        return rc;
    }
}
