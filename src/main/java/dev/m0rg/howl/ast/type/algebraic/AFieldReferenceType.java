package dev.m0rg.howl.ast.type.algebraic;

import java.util.Set;

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
        if (source instanceof AStructureType) {
            AStructureType struct = (AStructureType) source;
            return struct.getField(name);
        } else if (source instanceof Applicable) {
            return new AFieldReferenceType(((Applicable) source).apply(), name);
        } else {
            throw new RuntimeException();
        }
    }
}
