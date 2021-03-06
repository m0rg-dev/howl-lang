package dev.m0rg.howl.ast.type.algebraic;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import dev.m0rg.howl.logger.Logger;

public class AIntersectionType extends ALambdaTerm implements AStructureType, Applicable {
    List<ALambdaTerm> members;

    public AIntersectionType(List<ALambdaTerm> members) {
        this.members = new ArrayList<>(members);
    }

    @Override
    public Set<String> freeVariables() {
        Set<String> rc = new HashSet<>();
        for (ALambdaTerm t : this.members) {
            rc.addAll(t.freeVariables());
        }
        return rc;
    }

    @Override
    public ALambdaTerm substitute(String from, ALambdaTerm to) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException();
    }

    @Override
    public String format() {
        return "(" + String.join(" ∩ ", members.stream().map(x -> x.format()).toList()) + ")";
    }

    @Override
    public ALambdaTerm getField(String name) {
        for (ALambdaTerm t : this.members) {
            if (t instanceof AStructureType) {
                AStructureType struct = (AStructureType) t;
                if (struct.hasField(name)) {
                    return struct.getField(name);
                }
            }
        }
        throw new RuntimeException(name);
    }

    @Override
    public boolean hasField(String name) {
        throw new UnsupportedOperationException(name);
    }

    @Override
    public boolean isApplicable() {
        for (ALambdaTerm t : this.members) {
            if (t instanceof Applicable && ((Applicable) t).isApplicable()) {
                return true;
            }
        }
        return false;
    }

    @Override
    public ALambdaTerm apply() {
        List<ALambdaTerm> rc = new ArrayList<>();
        for (ALambdaTerm t : this.members) {
            if (t instanceof Applicable && ((Applicable) t).isApplicable()) {
                rc.add(((Applicable) t).apply());
            } else {
                rc.add(t);
            }
        }
        return new AIntersectionType(rc);
    }

    @Override
    public boolean accepts(ALambdaTerm other) {
        if (other instanceof AIntersectionType) {
            throw new UnsupportedOperationException();
        } else if (other instanceof AStructureType) {
            return this.members.stream().anyMatch(x -> x.accepts(other));
        } else if (other.isFree()) {
            return true;
        }
        return false;
    }
}
