package dev.m0rg.howl.ast.type.iterative;

import dev.m0rg.howl.ast.Span;

public class ErrorType extends TypeObject {
    Span source;
    String message;

    public ErrorType(Span source, String message) {
        this.source = source;
        this.message = message;
    }

    public String format() {
        return "∅";
    }
}
