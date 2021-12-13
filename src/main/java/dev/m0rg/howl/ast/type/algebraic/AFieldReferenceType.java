package dev.m0rg.howl.ast.type.algebraic;

import java.util.Map;
import java.util.Optional;

import dev.m0rg.howl.ast.Field;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.StructureType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.logger.Logger;

public class AFieldReferenceType extends AlgebraicType {
    AlgebraicType source;
    String name;

    public AFieldReferenceType(AlgebraicType source, String name) {
        this.source = source;
        this.name = name;
    }

    public String format() {
        return this.source.format() + ":" + this.name;
    }

    public AlgebraicType evaluate(Map<String, AlgebraicType> evalmap) {
        AlgebraicType source_eval = source.evaluate(evalmap);
        if (source_eval instanceof AStructureType) {
            return ((AStructureType) source_eval).getField(name).evaluate(evalmap);
        } else if (source_eval instanceof AAnyType) {
            return source_eval;
        } else {
            return this;
        }
    }

    public TypeElement toElement() {
        TypeElement source_type = source.toElement();
        if (source_type instanceof StructureType) {
            StructureType ct = (StructureType) source_type;
            Optional<Field> f = ct.getField(name);
            if (f.isPresent()) {
                return f.get().getOwnType();
            } else {
                // TODO
                // span.addError("Attempt to access nonexistent field `" + name + "' on " +
                // ct.format(),
                // "available fields are: " + String.join(", ", ct.getFieldNames()));
                Logger.trace(
                        "creating error type (AFieldReferenceType): bad field " + name + " " + source_type.format());

                return NamedType.build(source_type.getSpan(), "__error");
            }
        } else {
            source_type.getSpan().addError("attempt to take fields on non-structure " + source_type.format());
            return NamedType.build(source_type.getSpan(), "__error");
        }
    }
}
