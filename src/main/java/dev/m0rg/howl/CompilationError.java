package dev.m0rg.howl;

import java.io.IOException;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

    class Position {
        public int line;
        public int column;

        public Position(int line, int column) {
            this.line = line;
            this.column = column;
        }
    }

    public String format() throws IOException {
        String source = Files.readString(span.source_path);

        List<String> lines = source.lines().toList();
        Map<Integer, Position> lines_mapped = new HashMap<>();
        int lineno = 1;
        int colno = 1;
        int offset = 0;
        for (int c : source.chars().toArray()) {
            lines_mapped.put(offset, new Position(lineno, colno));
            colno++;
            if (c == '\n') {
                lineno++;
                colno = 1;
            }
            offset++;
        }
        // handle no-newline-at-end-of-file cases
        lines_mapped.put(offset, new Position(lineno, colno));

        Position start = lines_mapped.get(span.start);
        Position end = lines_mapped.get(span.end);
        List<String> lines_in_play = lines.subList(start.line - 1, end.line);

        StringBuilder rc = new StringBuilder();
        rc.append("\u001b[31;1merror\u001b[0m: ");
        rc.append(span.source_path.toString());
        rc.append(" " + start.line + ":" + start.column + ": ");
        rc.append(message);
        rc.append("\n");

        if (lines_in_play.size() == 1) {
            rc.append(String.format("    \u001b[32m%5d\u001b[0m %s\n", start.line,
                    lines_in_play.get(0)));
            rc.append("         \u001b[1;35m");
            rc.append(" ".repeat(start.column));
            rc.append("^".repeat(end.column - start.column));
            rc.append("\u001b[0m\n");
        } else {
            for (int l = start.line; l <= end.line; l++) {
                rc.append(String.format("   \u001b[32m%5d\u001b[0m %s\n", l, lines_in_play.get(l - start.line)));
            }
        }

        if (this.description.isPresent()) {
            rc.append("\n");
            rc.append(this.description.get().indent(2));
        }
        return rc.toString();
    }

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + ((description == null) ? 0 : description.hashCode());
        result = prime * result + ((message == null) ? 0 : message.hashCode());
        result = prime * result + ((span == null) ? 0 : span.hashCode());
        return result;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj)
            return true;
        if (obj == null)
            return false;
        if (getClass() != obj.getClass())
            return false;
        CompilationError other = (CompilationError) obj;
        if (description == null) {
            if (other.description != null)
                return false;
        } else if (!description.equals(other.description))
            return false;
        if (message == null) {
            if (other.message != null)
                return false;
        } else if (!message.equals(other.message))
            return false;
        if (span == null) {
            if (other.span != null)
                return false;
        } else if (!span.equals(other.span))
            return false;
        return true;
    }
}
