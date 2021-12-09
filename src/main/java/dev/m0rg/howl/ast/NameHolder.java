package dev.m0rg.howl.ast;

import java.util.Arrays;
import java.util.Optional;

public interface NameHolder {
    Optional<ASTElement> getChild(String name);

    default Optional<ASTElement> getPath(String path) {
        String[] parts = path.split("\\.");
        if (parts.length == 1) {
            return this.getChild(parts[0]);
        } else {
            return this.getChild(parts[0]).flatMap(x -> {
                if (x instanceof NameHolder) {
                    return ((NameHolder) x).getPath(String.join(".", Arrays.copyOfRange(parts, 1, parts.length)));
                } else {
                    return Optional.empty();
                }
            });
        }
    }
}
