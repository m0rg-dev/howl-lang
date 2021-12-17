package dev.m0rg.howl.ast.type.algebraic;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

import dev.m0rg.howl.ast.Argument;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.llvm.LLVMFunctionType;
import dev.m0rg.howl.llvm.LLVMModule;
import dev.m0rg.howl.llvm.LLVMType;

public class AFunctionReference extends AFunctionType implements Applicable {
    Function source;
    Map<String, ALambdaTerm> substitutions;

    public AFunctionReference(Function source) {
        this.source = source;
        this.substitutions = new HashMap<>();
    }

    public ALambdaTerm getReturn() {
        ALambdaTerm rc = AlgebraicType.derive(source.getReturn());
        for (Entry<String, ALambdaTerm> s : substitutions.entrySet()) {
            rc = rc.substitute(s.getKey(), s.getValue());
        }
        return rc;
    }

    @Override
    public ALambdaTerm getReturn(List<ALambdaTerm> argtypes) {
        return this.getReturn();
    }

    @Override
    public ALambdaTerm getArgument(int index, List<ALambdaTerm> argtypes) {
        ALambdaTerm rc;
        if (source.isStatic()) {
            rc = AlgebraicType.derive(source.getArgumentList().get(index));
        } else {
            rc = AlgebraicType.derive(source.getArgumentList().get(index + 1));
        }
        for (Entry<String, ALambdaTerm> s : substitutions.entrySet()) {
            rc = rc.substitute(s.getKey(), s.getValue());
        }
        return rc;
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
        AFunctionReference rc = new AFunctionReference(source);
        rc.substitutions.putAll(substitutions);
        rc.substitutions.put(from, to);
        return rc;
    }

    @Override
    public String format() {
        if (substitutions.isEmpty()) {
            return "fn " + source.getPath();
        } else {
            List<String> s = new ArrayList<>();
            for (Entry<String, ALambdaTerm> e : substitutions.entrySet()) {
                s.add(e.getKey() + " := " + e.getValue().format());
            }
            return "fn " + source.getPath() + "[" + String.join(", ", s) + "]";
        }
    }

    @Override
    public String formatPretty() {
        ALambdaTerm rctype = getReturn(new ArrayList<>());
        for (Entry<String, ALambdaTerm> e : substitutions.entrySet()) {
            rctype = rctype.substitute(e.getKey(), e.getValue());
        }
        rctype = ALambdaTerm.evaluate(rctype);
        List<String> argtypes = new ArrayList<>();
        int count = source.getArgumentList().size();
        if (!source.isStatic())
            count--;
        for (int i = 0; i < count; i++) {
            ALambdaTerm a = getArgument(i, new ArrayList<>());
            for (Entry<String, ALambdaTerm> e : substitutions.entrySet()) {
                a = a.substitute(e.getKey(), e.getValue());
            }
            a = ALambdaTerm.evaluate(a);
            argtypes.add(a.formatPretty());
        }

        return rctype.formatPretty() + " " + source.getOriginalName() + "(" + String.join(", ", argtypes) + ")";
    }

    public List<ALambdaTerm> argumentTypesEvaluated() {
        List<ALambdaTerm> argtypes = new ArrayList<>();
        int count = source.getArgumentList().size();
        if (!source.isStatic())
            count--;
        for (int i = 0; i < count; i++) {
            ALambdaTerm a = getArgument(i, new ArrayList<>());
            for (Entry<String, ALambdaTerm> e : substitutions.entrySet()) {
                a = a.substitute(e.getKey(), e.getValue());
            }
            a = ALambdaTerm.evaluate(a);
            argtypes.add(a);
        }
        return argtypes;
    }

    public Function getSource() {
        return source;
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
        AFunctionReference rc = new AFunctionReference(source);
        for (Entry<String, ALambdaTerm> s : substitutions.entrySet()) {
            if (s.getValue() instanceof Applicable && ((Applicable) s.getValue()).isApplicable()) {
                rc.substitutions.put(s.getKey(), ((Applicable) s.getValue()).apply());
            } else {
                rc.substitutions.put(s.getKey(), s.getValue());
            }
        }
        return rc;
    }

    @Override
    public LLVMFunctionType toLLVM(LLVMModule module) {
        LLVMType returntype = ALambdaTerm.evaluate(getReturn()).toLLVM(module);
        List<LLVMType> args = new ArrayList<>(source.getArgumentList().size());
        for (Argument a : source.getArgumentList()) {
            ALambdaTerm t = AlgebraicType.derive(a.getOwnType());
            for (Entry<String, ALambdaTerm> e : substitutions.entrySet()) {
                t = t.substitute(e.getKey(), e.getValue());
            }
            args.add(ALambdaTerm.evaluate(t).toLLVM(module));
        }
        return new LLVMFunctionType(returntype, args);
    }
}
