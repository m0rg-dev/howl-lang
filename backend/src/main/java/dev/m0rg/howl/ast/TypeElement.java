package dev.m0rg.howl.ast;

import java.util.Optional;

import dev.m0rg.howl.llvm.LLVMContext;
import dev.m0rg.howl.llvm.LLVMType;

public abstract class TypeElement extends ASTElement {
    public TypeElement(Span span) {
        super(span);
    }

    public abstract String mangle();

    public abstract boolean accepts(TypeElement other);

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
                if (nt.getResolution().isPresent()) {
                    rc = nt.getResolution().get();
                    continue;
                } else {
                    return new NamedType(span, "__any");
                }
            } else if (rc instanceof RawPointerType) {
                RawPointerType new_rc = (RawPointerType) rc.detach();
                new_rc.setParent(rc.getParent());
                new_rc.setInner((TypeElement) new_rc.getInner().resolve().detach());
                return new_rc;
            } else {
                return rc;
            }
        }
    }

    public LLVMType generate(LLVMContext c) {
        return null;
    }
}
