package dev.m0rg.howl.ast;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

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
    public TypeElement getType() {
        TypeElement lhs_type = this.lhs.getResolvedType();
        TypeElement rhs_type = this.rhs.getResolvedType();
        if (lhs_type instanceof NamedType && ((NamedType) lhs_type).getName().equals("__any")) {
            lhs_type = NamedType.build(lhs_type.getSpan(), "__numeric");
        }
        if (rhs_type instanceof NamedType && ((NamedType) rhs_type).getName().equals("__any")) {
            rhs_type = NamedType.build(rhs_type.getSpan(), "__numeric");
        }

        if (lhs_type instanceof NumericType && rhs_type instanceof NumericType) {
            if (comparison_operators.contains(operator)) {
                return NamedType.build(span, "bool");
            } else {
                NumericType lhs_numeric = (NumericType) lhs_type;
                NumericType rhs_numeric = (NumericType) rhs_type;

                if (lhs_numeric.is_literal) {
                    return rhs_numeric;
                }
                if (rhs_numeric.is_literal) {
                    return lhs_numeric;
                }

                int max_width = Math.max(lhs_numeric.getWidth(), rhs_numeric.getWidth());
                if (lhs_numeric.isSigned() != rhs_numeric.isSigned()) {
                    // TODO compilation-warning
                }
                return NumericType.build(span, max_width, lhs_numeric.isSigned());
            }
        } else {
            return NamedType.build(span, "__error");
        }
    }
}
