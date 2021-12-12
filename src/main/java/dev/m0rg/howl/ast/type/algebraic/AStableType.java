package dev.m0rg.howl.ast.type.algebraic;

import java.util.Map;

import dev.m0rg.howl.ast.type.ClassStaticType;
import dev.m0rg.howl.ast.type.InterfaceStaticType;
import dev.m0rg.howl.ast.type.TypeElement;

public class AStableType extends AStructureType {
    public AStableType(TypeElement source) {
        this.source = source;
    }

    public AStableType(AStableType other, Map<String, AlgebraicType> evalmap) {
        super(other, evalmap);
    }

    public AlgebraicType getField(String name) {
        // no generics by this point! static tables only exist after
        // monomorphization.
        if (source instanceof ClassStaticType) {
            return AlgebraicType.derive(((ClassStaticType) source).getField(name).get());
        } else {
            return AlgebraicType.derive(((InterfaceStaticType) source).getField(name).get());
        }
    }

    public AlgebraicType getFieldRaw(String name) {
        return getField(name);
    }

    public AlgebraicType evaluate(Map<String, AlgebraicType> evalmap) {
        return new AStableType(this, evalmap);
    }
}