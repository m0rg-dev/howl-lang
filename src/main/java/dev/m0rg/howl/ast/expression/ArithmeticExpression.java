package dev.m0rg.howl.ast.expression;

import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.algebraic.ABaseType;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMIntPredicate;
import dev.m0rg.howl.llvm.LLVMValue;

public class ArithmeticExpression extends Expression {
    static final Set<String> comparison_operators;

    static {
        Set<String> comps = new HashSet<String>();
        comps.add("<");
        comps.add("<=");
        comps.add(">");
        comps.add(">=");
        comps.add("==");
        comps.add("!=");
        comparison_operators = Collections.unmodifiableSet(comps);
    }

    Expression lhs;
    Expression rhs;
    String operator;

    public ArithmeticExpression(Span span, String operator) {
        super(span);
        this.operator = operator;
    }

    @Override
    public String format() {
        return "(" + this.lhs.format() + ") " + this.operator + " (" + this.rhs.format() + ")";
    }

    @Override
    public ASTElement detach() {
        ArithmeticExpression rc = new ArithmeticExpression(span, operator);
        rc.setLHS((Expression) this.lhs.detach());
        rc.setRHS((Expression) this.rhs.detach());
        return rc;
    }

    public String getOperator() {
        return operator;
    }

    public Expression getLHS() {
        return lhs;
    }

    public void setLHS(Expression lhs) {
        this.lhs = (Expression) lhs.setParent(this);
    }

    public Expression getRHS() {
        return rhs;
    }

    public void setRHS(Expression rhs) {
        this.rhs = (Expression) rhs.setParent(this);
    }

    public void transform(ASTTransformer t) {
        this.lhs.transform(t);
        this.setLHS(t.transform(lhs));
        this.rhs.transform(t);
        this.setRHS(t.transform(rhs));
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        // TODO
        rc.put("rhs",
                new FieldHandle(() -> this.getRHS(), (e) -> this.setRHS(e),
                        () -> AlgebraicType.derive(this.getLHS())));
        return rc;
    }

    public ALambdaTerm getType() {
        if (comparison_operators.contains(operator)) {
            return new ABaseType("bool");
        } else {
            // TODO
            return AlgebraicType.derive(this.getLHS());
        }
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        switch (operator) {
            case "+":
                return builder.buildAdd(this.lhs.generate(builder), this.rhs.generate(builder), "");
            case "-":
                return builder.buildSub(this.lhs.generate(builder), this.rhs.generate(builder), "");
            case "*":
                return builder.buildMul(this.lhs.generate(builder), this.rhs.generate(builder), "");
            case "/":
                return builder.buildSDiv(this.lhs.generate(builder), this.rhs.generate(builder), "");
            case "%":
                return builder.buildSRem(this.lhs.generate(builder), this.rhs.generate(builder), "");
            case ">":
                return builder.buildICmp(LLVMIntPredicate.LLVMIntSGT, this.lhs.generate(builder),
                        this.rhs.generate(builder), "");
            case "<":
                return builder.buildICmp(LLVMIntPredicate.LLVMIntSLT, this.lhs.generate(builder),
                        this.rhs.generate(builder), "");
            case ">=":
                return builder.buildICmp(LLVMIntPredicate.LLVMIntSGE, this.lhs.generate(builder),
                        this.rhs.generate(builder), "");
            case "<=":
                return builder.buildICmp(LLVMIntPredicate.LLVMIntSLE, this.lhs.generate(builder),
                        this.rhs.generate(builder), "");
            case "==":
                return builder.buildICmp(LLVMIntPredicate.LLVMIntEQ, this.lhs.generate(builder),
                        this.rhs.generate(builder), "");
            case "!=":
                return builder.buildICmp(LLVMIntPredicate.LLVMIntNE, this.lhs.generate(builder),
                        this.rhs.generate(builder), "");
            default:
                throw new RuntimeException("unimplemented operator " + operator);
        }
    }
}
