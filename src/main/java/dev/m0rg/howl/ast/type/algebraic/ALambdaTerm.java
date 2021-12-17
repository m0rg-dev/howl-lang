package dev.m0rg.howl.ast.type.algebraic;

import java.util.Set;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.llvm.LLVMModule;
import dev.m0rg.howl.llvm.LLVMType;
import dev.m0rg.howl.logger.Logger;

public abstract class ALambdaTerm extends AlgebraicType {
    /**
     * Returns the set of free variables under this term.
     */
    public abstract Set<String> freeVariables();

    /**
     * Applies the substitution {@code this[from := to]}.
     */
    public abstract ALambdaTerm substitute(String from, ALambdaTerm to);

    /**
     * Attempts to β-normalize the given {@code ALambdaTerm} by repeated
     * application.
     */
    public static ALambdaTerm evaluate(ALambdaTerm t) {
        while (t instanceof Applicable && ((Applicable) t).isApplicable()) {
            Logger.trace("apply " + t.format());
            t = ((Applicable) t).apply();
        }
        return t;
    }

    /**
     * Convenience function to derive a type and evaluate it.
     */
    public static ALambdaTerm evaluateFrom(ASTElement t) {
        return evaluate(AlgebraicType.derive(t));
    }

    /**
     * Predicate for whether this ALambdaTerm identifies a type that's
     * compatible with {@code other}. For simplicity, both {@code this} and
     * {@code other} are assumed to already be in β-normal form.
     */
    public boolean accepts(ALambdaTerm other) {
        throw new UnsupportedOperationException(this.getClass().getName());
    }

    /**
     * Predicate for whether this ALambdaTerm identifies a type that's
     * equivalent to {@code other} by checking both {@code this <- other} and
     * {@code other <- this}. For simplicity, both {@code this} and
     * {@code other} are assumed to already be in β-normal form.
     */
    public boolean equals(ALambdaTerm other) {
        return this.accepts(other) && other.accepts(this);
    }

    /**
     * Generates a {@code LLVMType} representing the type identified by this
     * ALambdaTerm. For simplicity, {@code this} is assumed to already be in
     * β-normal form.
     */
    public LLVMType toLLVM(LLVMModule module) {
        throw new UnsupportedOperationException(this.getClass().getName() + " " + this.format());
    }

    /**
     * Formats in a way that more closely represents the element in the original
     * source, even if that loses information.
     */
    public String formatPretty() {
        return format();
    }

    public boolean isFree() {
        if (this instanceof AAnyType)
            return true;
        if (this instanceof AVariable)
            return true;
        if (this instanceof ANewtype) {
            if (!((ANewtype) this).source.isResolved()) {
                return true;
            }
        }
        return false;
    }
}
