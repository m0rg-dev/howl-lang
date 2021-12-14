package dev.m0rg.howl.ast.type.algebraic;

import java.util.HashSet;
import java.util.Set;

import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.NumericType;

public class ABaseType extends ALambdaTerm {
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
}
