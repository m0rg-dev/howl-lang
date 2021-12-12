package dev.m0rg.howl.ast.type.algebraic;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

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

    public String getPath() {
        return owner.getPath();
    }

    public AlgebraicType evaluate(Map<String, AlgebraicType> evalmap) {
        if (evalmap.containsKey(this.owner.getPath())) {
            AlgebraicType rc = evalmap.get(this.owner.getPath());
            Set<String> seen = new HashSet<>();

            while (rc instanceof AFreeType) {
                AFreeType ft = (AFreeType) rc;
                if (seen.contains(ft.getPath())) {
                    // break the cycle
                    return this;
                }

                if (!evalmap.containsKey(ft.getPath())) {
                    return rc;
                }

                seen.add(ft.getPath());
                rc = evalmap.get(ft.getPath());
            }

            return rc;
        }
        return this;
    }

    public AlgebraicType half_evaluate() {
        return this;
    }
}
