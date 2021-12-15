package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.List;

public interface Walkable {
    public default List<ASTElement> getContents() {
        return new ArrayList<>();
    }
}
