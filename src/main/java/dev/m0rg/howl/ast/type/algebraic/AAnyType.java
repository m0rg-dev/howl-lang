package dev.m0rg.howl.ast.type.algebraic;

import java.util.Map;

import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.TypeElement;

public class AAnyType extends AlgebraicType {
    public String format() {
        return "Any";
    }

    public AlgebraicType evaluate(Map<String, AlgebraicType> evalmap) {
        return this;
    }

    public TypeElement toElement() {
        return NamedType.build(null, "__any");
    }
}
