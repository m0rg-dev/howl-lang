package dev.m0rg.howl.ast.type.algebraic;

import java.util.Map;
import java.util.Optional;

import dev.m0rg.howl.ast.Field;
import dev.m0rg.howl.ast.type.ClassStaticType;
import dev.m0rg.howl.ast.type.InterfaceStaticType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.logger.Logger;

@Deprecated
public class AStableTypeOld extends AStructureType {
    public AStableTypeOld(TypeElement source) {
        this.source = source;
    }

    public AStableTypeOld(AStableTypeOld other, Map<String, AlgebraicType> evalmap) {
        super(other, evalmap);
    }

    public AlgebraicType getField(String name) {
        // no generics by this point! static tables only exist after
        // monomorphization.
        if (source instanceof ClassStaticType) {
            Optional<Field> rc = ((ClassStaticType) source).getField(name);
            if (rc.isPresent()) {
                return AlgebraicType.derive(rc.get());
            } else {
                Logger.trace("creating error type: bad static field " + name + " " + source.format());
                return new ABaseType("__error");
            }
        } else if (source instanceof InterfaceStaticType) {
            Optional<Field> rc = ((InterfaceStaticType) source).getField(name);
            if (rc.isPresent()) {
                return AlgebraicType.derive(rc.get());
            } else {
                Logger.trace("creating error type: bad static field " + name + " " + source.format());
                return new ABaseType("__error");
            }
        } else {
            throw new RuntimeException(source.format());
        }
    }

    public AlgebraicType getFieldRaw(String name) {
        return getField(name);
    }

    public AlgebraicType evaluate(Map<String, AlgebraicType> evalmap) {
        return new AStableTypeOld(this, evalmap);
    }
}