package dev.m0rg.howl.ast;

import java.util.function.Consumer;
import java.util.function.Supplier;

import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;

public class FieldHandle {
    Supplier<Expression> _get;
    Consumer<Expression> _set;
    Supplier<AlgebraicType> _expects;

    public FieldHandle(Supplier<Expression> get, Consumer<Expression> set, Supplier<AlgebraicType> expects) {
        this._get = get;
        this._set = set;
        this._expects = expects;
    }

    public Expression getSubexpression() {
        return this._get.get();
    }

    public void setSubexpression(Expression e) {
        this._set.accept(e);
    }

    public AlgebraicType getExpectedType() {
        return this._expects.get();
    }
}
