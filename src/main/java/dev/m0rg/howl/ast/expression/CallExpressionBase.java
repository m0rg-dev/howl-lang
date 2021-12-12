package dev.m0rg.howl.ast.expression;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;

public abstract class CallExpressionBase extends Expression {
    protected List<Expression> args;

    public CallExpressionBase(Span span) {
        super(span);
        this.args = new ArrayList<Expression>();
    }

    public void insertArgument(Expression arg) {
        this.args.add((Expression) arg.setParent(this));
    }

    public void prependArgument(Expression arg) {
        this.args.add(0, (Expression) arg.setParent(this));
    }

    public List<Expression> getArguments() {
        return Collections.unmodifiableList(args);
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

    protected void copyArguments(CallExpressionBase target) {
        for (Expression arg : args) {
            target.insertArgument((Expression) arg.detach());
        }
    }

    protected abstract AlgebraicType getTypeForArgument(int index);

    protected void addFields(Map<String, FieldHandle> target) {
        int index = 0;
        for (Expression arg : args) {
            int i2 = index;
            target.put(((Number) index).toString(), new FieldHandle(() -> arg,
                    (e) -> this.args.set(i2, (Expression) e.setParent(this)), () -> this.getTypeForArgument(i2)));
            index++;
        }
    }
}
