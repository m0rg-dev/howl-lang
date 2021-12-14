package dev.m0rg.howl.ast.type.algebraic;

public class AStructureReference extends AlgebraicType {
    String source_path;

    public AStructureReference(String source_path) {
        this.source_path = source_path;
    }

    @Override
    public String format() {
        return "struct " + source_path;
    }
}
