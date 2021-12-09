package dev.m0rg.howl.ast;

import java.util.List;
import java.util.Optional;

public interface StructureType {
    public Optional<Field> getField(String name);

    public List<String> getFieldNames();

    public String format();
}
