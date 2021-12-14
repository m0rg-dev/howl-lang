package dev.m0rg.howl.ast.type.algebraic;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Map.Entry;

import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.Overload;

public class AOverloadType extends ALambdaTerm {
    Overload source;
    Map<String, ALambdaTerm> substitutions;

    public AOverloadType(Overload source) {
        this.source = source;
        this.substitutions = new HashMap<>();
    }

    @Override
    public Set<String> freeVariables() {
        return new HashSet<>();
    }

    @Override
    public ALambdaTerm substitute(String from, ALambdaTerm to) {
        AOverloadType rc = new AOverloadType(source);
        rc.substitutions.putAll(substitutions);
        rc.substitutions.put(from, to);
        return rc;
    }

    @Override
    public String format() {
        if (substitutions.isEmpty()) {
            return source.format();
        } else {
            List<String> s = new ArrayList<>();
            for (Entry<String, ALambdaTerm> e : substitutions.entrySet()) {
                s.add(e.getKey() + " := " + e.getValue().format());
            }
            return source.format() + "[" + String.join(", ", s) + "]";
        }
    }

    public ALambdaTerm getReturn() {
        List<Function> candidates = source.getSource().getOverloadCandidates(source.getName());
        if (candidates.size() == 1) {
            ALambdaTerm rc = AlgebraicType.deriveNew(candidates.get(0).getReturn());
            for (Entry<String, ALambdaTerm> s : substitutions.entrySet()) {
                rc = rc.substitute(s.getKey(), s.getValue());
            }
            return rc;
        } else {
            throw new RuntimeException();
        }
    }
}
