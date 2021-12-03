package dev.m0rg.howl.ast;

import java.util.Optional;

public class ReturnStatement extends Statement {
    Optional<Expression> source;

    public ReturnStatement(Span span) {
        super(span);
        this.source = Optional.empty();
    }

    @Override
    public String format() {
        if (this.source.isPresent()) {
            return "return " + this.source.get().format() + ";";
        } else {
            return "return;";
        }
    }

    public void setSource(Expression source) {
        source.assertInsertable();
        this.source = Optional.of((Expression) source.setParent(this));
    }
}
