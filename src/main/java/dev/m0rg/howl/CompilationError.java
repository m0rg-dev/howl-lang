package dev.m0rg.howl;

import java.util.Optional;

import dev.m0rg.howl.ast.Span;

public class CompilationError {
    Span span;
    String message;
    Optional<String> description;

    public CompilationError(Span span, String message) {
        this.span = span;
        this.message = message;
        this.description = Optional.empty();
    }

    public CompilationError(Span span, String message, String description) {
        this(span, message);
        this.description = Optional.of(description);
    }

    public String toString() {
        StringBuilder rc = new StringBuilder();
        rc.append(message);
        if (this.description.isPresent()) {
            rc.append("\n");
            rc.append(this.description.get().indent(2));
        }
        return rc.toString();
    }
}
