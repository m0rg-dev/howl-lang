package dev.m0rg.howl.ast;

import java.util.Optional;

public class NameExpression extends Expression {
    String name;

    public NameExpression(Span span, String name) {
        super(span);
        this.name = name;
    }

    @Override
    public String format() {
        String resolution = "\u001b[31m/* = <unresolved> */\u001b[0m";
        Optional<ASTElement> target = this.resolveName(this.name);
        if (target.isPresent()) {
            resolution = "\u001b[32m/* = " + target.get().getPath() + " */\u001b[0m";
        }
        return this.name + " " + resolution;
    }

    public void transform(ASTTransformer t) {
        ;
    }

    public String getName() {
        return this.name;
    }
}
