package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.List;

public abstract class CallExpressionBase extends Expression {
    List<Expression> args;

    public CallExpressionBase(Span span) {
        super(span);
        this.args = new ArrayList<Expression>();
    }

    public void insertArgument(Expression arg) {
        arg.assertInsertable();
        this.args.add((Expression) arg.setParent(this));
    }

    protected String getArgString() {
        List<String> contents = new ArrayList<String>(this.args.size());
        for (Expression a : this.args) {
            contents.add(a.format());
        }
        return "(" + String.join(", ", contents) + ")";
    }
}
