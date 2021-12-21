package dev.m0rg.howl.ast.type.iterative;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;

public class Select extends ProductionRule {

    @Override
    boolean matches(TypeObject source, Map<Expression, TypeObject> environment) {
        // TODO Auto-generated method stub
        if (source.dereferenced(environment) instanceof OverloadSelect) {
            OverloadSelect sel = (OverloadSelect) source.dereferenced(environment);
            if (sel.source.dereferenced(environment) instanceof OverloadType
                    && sel.args.stream().allMatch(x -> x.isSubstitutable(environment))) {
                return true;
            }
        }
        return false;

    }

    @Override
    TypeObject apply(TypeObject source, Map<Expression, TypeObject> environment) {
        OverloadSelect sel = (OverloadSelect) source.dereferenced(environment);
        OverloadType o = (OverloadType) sel.source.dereferenced(environment);
        List<FunctionType> matches = new ArrayList<>();
        candidate: for (TypeObject candidate : o.source) {
            if (candidate.dereferenced(environment) instanceof FunctionType) {
                FunctionType f = (FunctionType) candidate.dereferenced(environment);
                if (f.args.size() != sel.args.size()) {
                    continue candidate;
                }

                for (int i = 0; i < f.args.size(); i++) {
                    if (!f.args.get(i).accepts(sel.args.get(i), environment)) {
                        continue candidate;
                    }
                }

                matches.add(f);
            }
        }

        if (matches.size() == 1) {
            FunctionType f = matches.get(0);
            List<TypeObject> intersected_args = new ArrayList<>();
            for (int i = 0; i < f.args.size(); i++) {
                if (f.args.get(i) instanceof TypeAlias) {
                    TypeAlias t = ((TypeAlias) f.args.get(i)).last_reference(environment);
                    FreeVariable v = new FreeVariable();
                    environment.put(v, environment.get(t.handle));
                    environment.put(t.handle, new IntersectionType(new TypeAlias(v), sel.args.get(i)));
                } else {
                    throw new RuntimeException();
                }
            }
            FreeVariable v = new FreeVariable();
            environment.put(v, new FunctionType(f.source, f.return_type, f.self_type, intersected_args));
            return new CallType(new TypeAlias(v));
        }

        throw new RuntimeException();
    }

}
