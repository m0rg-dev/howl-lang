package dev.m0rg.howl.ast.type.algebraic;

import java.util.Set;

import dev.m0rg.howl.logger.Logger;

public class AFieldReferenceType extends ALambdaTerm implements Applicable {
    ALambdaTerm source;
    String name;

    public AFieldReferenceType(ALambdaTerm source, String name) {
        this.source = source;
        this.name = name;
    }

    @Override
    public String format() {
        return this.source.format() + "->" + this.name;
    }

    @Override
    public Set<String> freeVariables() {
        return this.source.freeVariables();
    }

    @Override
    public ALambdaTerm substitute(String from, ALambdaTerm to) {
        return new AFieldReferenceType(source.substitute(from, to), name);
    }

    @Override
    public ALambdaTerm apply() {
        if (source instanceof Applicable && ((Applicable) source).isApplicable()) {
            return new AFieldReferenceType(((Applicable) source).apply(), name);
        } else if (source instanceof AStructureType) {
            AStructureType struct = (AStructureType) source;
            return struct.getField(name);
        } else if (source instanceof AErrorType) {
            return source;
        } else {
            Logger.error(this.format());
            throw new RuntimeException();
        }
    }
}
