package dev.m0rg.howl.ast.type.algebraic;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.NumericType;
import dev.m0rg.howl.llvm.LLVMIntType;
import dev.m0rg.howl.llvm.LLVMModule;
import dev.m0rg.howl.llvm.LLVMType;
import dev.m0rg.howl.llvm.LLVMVoidType;

public class ABaseType extends ALambdaTerm implements Mangle {
    static Pattern numeric_regex = Pattern.compile("^[iu][0-9]+");

    String name;

    public ABaseType(String name) {
        this.name = name;
    }

    public String format() {
        return "#" + name;
    }

    public String getName() {
        return name;
    }

    public Set<String> freeVariables() {
        return new HashSet<>();
    }

    public ALambdaTerm substitute(String from, ALambdaTerm to) {
        return this;
    }

    @Override
    public boolean accepts(ALambdaTerm other) {
        if (other instanceof ABaseType) {
            if (((ABaseType) other).name.equals(name)) {
                return true;
            } else {
                NamedType t_this = NamedType.build(null, name);
                NamedType t_other = NamedType.build(null, ((ABaseType) other).name);
                if (t_this instanceof NumericType && t_other instanceof NumericType) {
                    if (((NumericType) t_other).isLiteral()) {
                        return true;
                    } else if (((NumericType) t_other).getWidth() >= ((NumericType) t_this).getWidth()) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        } else if (other instanceof AVariable || other instanceof AAnyType) {
            return true;
        } else {
            return false;
        }
    }

    @Override
    public String mangle() {
        return Integer.toString(name.length()) + name;
    }

    public Optional<Integer> numericWidth() {
        if (numeric_regex.matcher(name).matches()) {
            int width = Integer.parseInt(name.substring(1));
            return Optional.of(width);
        }
        return Optional.empty();
    }

    @Override
    public LLVMType toLLVM(LLVMModule module) {
        if (numeric_regex.matcher(name).matches()) {
            int width = Integer.parseInt(name.substring(1));
            return new LLVMIntType(module.getContext(), width);
        }

        if (this.name.equals("void")) {
            return new LLVMVoidType(module.getContext());
        } else if (this.name.equals("bool")) {
            return new LLVMIntType(module.getContext(), 1);
        } else if (this.name.equals("__numeric")) {
            return new LLVMIntType(module.getContext(), 64);
        } else {
            throw new UnsupportedOperationException("ABaseType " + this.name);
        }
    }
}
