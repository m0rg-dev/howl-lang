package dev.m0rg.howl.ast.type.algebraic;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class ATuple extends ALambdaTerm implements Applicable {
    List<ALambdaTerm> contents;

    public ATuple(List<ALambdaTerm> contents) {
        this.contents = new ArrayList<>(contents);
    }

    @Override
    public boolean isApplicable() {
        for (ALambdaTerm t : contents) {
            if (t instanceof Applicable && ((Applicable) t).isApplicable()) {
                return true;
            }
        }
        return false;
    }

    @Override
    public ALambdaTerm apply() {
        List<ALambdaTerm> rc = new ArrayList<>();
        for (ALambdaTerm t : contents) {
            if (t instanceof Applicable && ((Applicable) t).isApplicable()) {
                rc.add(((Applicable) t).apply());
            } else {
                rc.add(t);
            }
        }
        return new ATuple(rc);
    }

    @Override
    public Set<String> freeVariables() {
        Set<String> rc = new HashSet<>();
        for (ALambdaTerm t : contents) {
            rc.addAll(t.freeVariables());
        }
        return rc;
    }

    @Override
    public ALambdaTerm substitute(String from, ALambdaTerm to) {
        List<ALambdaTerm> rc = new ArrayList<>();
        for (ALambdaTerm t : contents) {
            rc.add(t.substitute(from, to));
        }
        return new ATuple(rc);
    }

    @Override
    public String format() {
        return "{" + String.join(", ", contents.stream().map(x -> x.format()).toList()) + "}";
    }

}
