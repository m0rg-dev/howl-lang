package dev.m0rg.howl.ast.type.algebraic;

import java.util.Map;

import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.TypeElement;

public class ABaseType extends AlgebraicType {
    String name;

    public ABaseType(String name) {
        this.name = name;
    }

    public String format() {
        return "#" + name;
    }

    public AlgebraicType evaluate(Map<String, AlgebraicType> evalmap) {
        return this;
    }

    public TypeElement toElement() {
        return NamedType.build(null, name);
    }

    public String getName() {
        return name;
    }
}
