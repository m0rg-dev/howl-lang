package dev.m0rg.howl.ast;

public class StringLiteral extends Expression {
    String contents;

    public StringLiteral(Span span, String contents) {
        super(span);
        this.contents = contents;
    }

    public String format() {
        return this.contents;
    }

    public void transform(ASTTransformer t) {
        ;
    }
}
