package dev.m0rg.howl.ast;

public class ArithmeticExpression extends Expression {
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

    public void setLHS(Expression lhs) {
        this.lhs = (Expression) lhs.setParent(this);
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
}
