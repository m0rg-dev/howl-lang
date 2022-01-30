package dev.m0rg.howl.ast.type.algebraic;

import java.util.HashSet;
import java.util.Set;

public class ASpecify extends ALambdaTerm implements Applicable {
    ALambdaTerm ref;
    ATuple source;

    public ASpecify(ALambdaTerm ref, ATuple source) {
        this.ref = ref;
        this.source = source;
    }

    @Override
    public boolean isApplicable() {
        return ref instanceof AStructureReference || ((ref instanceof Applicable) &&
                ((Applicable) ref).isApplicable());
    }

    @Override
    public ALambdaTerm apply() {
        if ((ref instanceof Applicable) && ((Applicable) ref).isApplicable()) {
            return new ASpecify(((Applicable) ref).apply(), source);
        }
        return new AStructureReference(((AStructureReference) ref).source, source);
    }

    @Override
    public Set<String> freeVariables() {
        Set<String> rc = new HashSet<>();
        rc.addAll(ref.freeVariables());
        rc.addAll(source.freeVariables());
        return rc;
    }

    @Override
    public ALambdaTerm substitute(String from, ALambdaTerm to) {
        return new ASpecify(ref.substitute(from, to), (ATuple) source.substitute(from, to));
    }

    @Override
    public String format() {
        return "spec " + ref.format() + " " + source.format();
    }

}
