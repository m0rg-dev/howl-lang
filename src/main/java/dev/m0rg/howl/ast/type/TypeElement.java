package dev.m0rg.howl.ast.type;

import java.util.Map;
import java.util.Optional;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.type.iterative.FreeVariable;
import dev.m0rg.howl.ast.type.iterative.TypeObject;

public abstract class TypeElement extends ASTElement {
    public TypeElement(Span span) {
        super(span);
    }

    public abstract String mangle();

    public FreeVariable deriveType(Map<Expression, TypeObject> environment) {
        throw new UnsupportedOperationException(this.getClass().getName());
    }

    public abstract boolean accepts(TypeElement other);

    public boolean acceptsReflexive(TypeElement other) {
        return this.accepts(other) && other.accepts(this);
    }

    public boolean isBase() {
        TypeElement res = this.resolve();
        if (res instanceof NamedType) {
            return true;
        } else if (res instanceof RawPointerType) {
            return ((RawPointerType) res).getInner().resolve().isBase();
        } else {
            return false;
        }
    }

    public TypeElement resolve() {
        TypeElement rc = this;
        while (true) {
            if (rc instanceof NamedType) {
                NamedType named = (NamedType) rc;
                if (named.isBase()) {
                    Optional<NumericType> as_numeric = NumericType.try_from(named);
                    if (as_numeric.isPresent()) {
                        return as_numeric.get();
                    } else {
                        return named;
                    }
                }

                Optional<ASTElement> target = named.resolveName(named.getName());
                if (target.isPresent() && target.get() instanceof TypeElement) {
                    rc = (TypeElement) target.get();
                    continue;
                } else if (target.isPresent() && target.get() instanceof HasOwnType) {
                    rc = ((HasOwnType) target.get()).getOwnType();
                } else {
                    // TODO
                    return new NamedType(span, "__error");
                }
            } else if (rc instanceof NewType) {
                NewType nt = (NewType) rc;
                return nt;
            } else if (rc instanceof RawPointerType) {
                RawPointerType new_rc = (RawPointerType) rc.detach();
                new_rc.setParent(rc.getParent());
                new_rc.setInner((TypeElement) new_rc.getInner().resolve().detach());
                return new_rc;
            } else if (rc instanceof SpecifiedType) {
                throw new RuntimeException();
            } else {
                return rc;
            }
        }
    }
}
