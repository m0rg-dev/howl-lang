package dev.m0rg.howl.ast;

import java.util.Optional;

public abstract class TypeElement extends ASTElement {
    public TypeElement(Span span) {
        super(span);
    }

    public abstract String mangle();

    public TypeElement resolve() {
        TypeElement rc = this;
        while (true) {
            if (rc instanceof NamedType) {
                NamedType named = (NamedType) rc;
                if (named.isBase()) {
                    return named;
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
                    return new NamedType(span, "__error");
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
}
