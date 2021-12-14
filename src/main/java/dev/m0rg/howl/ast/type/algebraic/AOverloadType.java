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
import dev.m0rg.howl.logger.Logger;

public class AOverloadType extends ALambdaTerm implements Applicable {
    Overload source;
    Map<String, ALambdaTerm> substitutions;

    public AOverloadType(Overload source) {
        this.source = source;
        this.substitutions = new HashMap<>();
    }

    @Override
    public Set<String> freeVariables() {
        HashSet<String> rc = new HashSet<>();
        for (Entry<String, ALambdaTerm> s : substitutions.entrySet()) {
            rc.addAll(s.getValue().freeVariables());
        }
        return rc;
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

    public Function select(List<ALambdaTerm> argtypes) {
        Logger.trace("Starting overload selection: " + this.format());
        Logger.trace("  overload args: " + String.join(", ", argtypes.stream().map(x -> x.format()).toList()));

        List<Function> candidates = source.getSource().getOverloadCandidates(source.getName());
        outer: for (Function candidate : candidates) {
            List<ALambdaTerm> candidate_types = candidate.getArgumentList().stream()
                    .map(x -> {
                        ALambdaTerm rc = ALambdaTerm.evaluate(AlgebraicType.deriveNew(x.getOwnType()));
                        for (Entry<String, ALambdaTerm> s : substitutions.entrySet()) {
                            rc = rc.substitute(s.getKey(), s.getValue());
                        }
                        return rc;
                    })
                    .toList();

            // slight hack to deal with methods having self as the first argument
            candidate_types = candidate_types.subList(1, candidate_types.size());

            Logger.trace("  candidate: " + candidate.getName() + "{"
                    + String.join(", ", candidate_types.stream().map(x -> x.format()).toList()) + "}");
            if (candidate_types.size() == argtypes.size()) {
                for (int i = 0; i < candidate_types.size(); i++) {
                    if (!candidate_types.get(i).accepts(argtypes.get(i))) {
                        Logger.trace("  => mismatch at position " + i);
                        continue outer;
                    }
                }
                Logger.trace("  selected.");
                return candidate;
            } else {
                Logger.trace("  => wrong argument count");
                continue outer;
            }
        }
        throw new RuntimeException();
    }

    public ALambdaTerm getReturn(List<ALambdaTerm> argtypes) {
        Function candidate = select(argtypes);

        ALambdaTerm rc = AlgebraicType.deriveNew(candidate.getReturn());
        for (Entry<String, ALambdaTerm> s : substitutions.entrySet()) {
            rc = rc.substitute(s.getKey(), s.getValue());
        }
        return rc;
    }

    public ALambdaTerm getArgument(int index, List<ALambdaTerm> argtypes) {
        Function candidate = select(argtypes);

        ALambdaTerm rc = AlgebraicType.deriveNew(candidate.getArgumentList().get(index).getOwnType());
        for (Entry<String, ALambdaTerm> s : substitutions.entrySet()) {
            rc = rc.substitute(s.getKey(), s.getValue());
        }
        return rc;
    }

    @Override
    public boolean isApplicable() {
        boolean rc = false;
        for (Entry<String, ALambdaTerm> s : substitutions.entrySet()) {
            if (s.getValue() instanceof Applicable && ((Applicable) s.getValue()).isApplicable()) {
                rc = true;
            }
        }
        return rc;
    }

    @Override
    public ALambdaTerm apply() {
        AOverloadType rc = new AOverloadType(source);
        for (Entry<String, ALambdaTerm> s : substitutions.entrySet()) {
            if (s.getValue() instanceof Applicable && ((Applicable) s.getValue()).isApplicable()) {
                rc.substitutions.put(s.getKey(), ((Applicable) s.getValue()).apply());
            } else {
                rc.substitutions.put(s.getKey(), s.getValue());
            }
        }
        return rc;
    }
}
