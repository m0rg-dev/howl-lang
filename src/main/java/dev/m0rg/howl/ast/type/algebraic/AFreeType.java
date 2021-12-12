package dev.m0rg.howl.ast.type.algebraic;

import java.util.Map;

import dev.m0rg.howl.ast.type.NewType;

public class AFreeType extends AlgebraicType {
    NewType owner;

    public AFreeType(NewType owner) {
        this.owner = owner;
    }

    public String format() {
        return "@" + owner.getPath();
    }

    public NewType toElement() {
        return owner;
    }

    public AlgebraicType evaluate(Map<String, AlgebraicType> evalmap) {
        if (evalmap.containsKey(this.owner.getPath())) {
            return evalmap.get(this.owner.getPath());
        }
        return this;
    }

    public AlgebraicType half_evaluate() {
        return this;
    }
}
