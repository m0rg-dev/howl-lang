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
        this.args.add((Expression) arg.setParent(this));
    }

    protected String getArgString() {
        List<String> contents = new ArrayList<String>(this.args.size());
        for (Expression a : this.args) {
            contents.add(a.format());
        }
        return "(" + String.join(", ", contents) + ")";
    }

    protected void transformArguments(ASTTransformer t) {
        int index = 0;
        for (Expression arg : args) {
            arg.transform(t);
            args.set(index, (Expression) t.transform(arg).setParent(this));
            index++;
        }
    }
}
