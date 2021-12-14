package dev.m0rg.howl.ast.type.algebraic;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Map.Entry;

import dev.m0rg.howl.ast.Argument;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.llvm.LLVMFunctionType;
import dev.m0rg.howl.llvm.LLVMModule;
import dev.m0rg.howl.llvm.LLVMType;

public class AFunctionReference extends AFunctionType {
    Function source;
    Map<String, ALambdaTerm> substitutions;

    public AFunctionReference(Function source) {
        this.source = source;
        this.substitutions = new HashMap<>();
    }

    @Override
    public ALambdaTerm getReturn(List<ALambdaTerm> argtypes) {
        return AlgebraicType.deriveNew(source.getReturn());
    }

    @Override
    public ALambdaTerm getArgument(int index, List<ALambdaTerm> argtypes) {
        if (source.isStatic()) {
            return AlgebraicType.deriveNew(source.getArgumentList().get(index));
        } else {
            return AlgebraicType.deriveNew(source.getArgumentList().get(index + 1));
        }
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

    public Function getSource() {
        return source;
    }

    @Override
    public LLVMType toLLVM(LLVMModule module) {
        LLVMType returntype = ALambdaTerm.evaluateFrom(source.getReturn()).toLLVM(module);
        List<LLVMType> args = new ArrayList<>(source.getArgumentList().size());
        for (Argument a : source.getArgumentList()) {
            ALambdaTerm t = AlgebraicType.deriveNew(a.getOwnType());
            for (Entry<String, ALambdaTerm> e : substitutions.entrySet()) {
                t = t.substitute(e.getKey(), e.getValue());
            }
            args.add(ALambdaTerm.evaluate(t).toLLVM(module));
        }
        return new LLVMFunctionType(returntype, args);
    }
}
