package dev.m0rg.howl.ast.type;

import java.util.List;
import java.util.Optional;

import dev.m0rg.howl.ast.Field;

public interface StructureType {
    public Optional<Field> getField(String name);

    public List<String> getFieldNames();

    public String format();
}
