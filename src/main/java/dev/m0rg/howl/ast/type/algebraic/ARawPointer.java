package dev.m0rg.howl.ast.type.algebraic;

import java.util.Map;

import dev.m0rg.howl.ast.type.RawPointerType;
import dev.m0rg.howl.ast.type.TypeElement;

public class ARawPointer extends AlgebraicType {
    AlgebraicType source;

    public ARawPointer(AlgebraicType source) {
        this.source = source;
    }

    public String format() {
        return "*" + source.format();
    }

    public AlgebraicType evaluate(Map<String, AlgebraicType> evalmap) {
        return new ARawPointer(source.evaluate(evalmap));
    }

    public AlgebraicType half_evaluate() {
        return new ARawPointer(source.half_evaluate());
    }

    public TypeElement toElement() {
        RawPointerType rc = new RawPointerType(null);
        rc.setInner((TypeElement) source.toElement().detach());
        return rc;
    }
}
