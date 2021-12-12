package dev.m0rg.howl.ast.type.algebraic;

import java.util.Map;

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
        } else {
            return this;
        }
    }

    public AlgebraicType half_evaluate() {
        Logger.trace("half_evaluate " + source.format());
        Logger.trace(name);
        if (source instanceof ASpecify) {
            AStructureType t = (AStructureType) ((ASpecify) source).getSource();
            Logger.trace(t.getFieldRaw(name).format());
            // TODO need to map it in the right order
            return new ASpecify(t.getFieldRaw(name), ((ASpecify) source).getParameters());
        }

        throw new UnsupportedOperationException();
    }

}
