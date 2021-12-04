package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public abstract class ASTElement {
    ASTElement parent;
    Span span;

    public ASTElement(Span span) {
        this.span = span;
    }

    public ASTElement setParent(ASTElement parent) {
        if (this.parent == null || this.parent == parent) {
            this.parent = parent;
            return this;
        } else {
            throw new RuntimeException("Attempt to move owned ASTElement");
        }
    }

    public ASTElement getParent() {
        return this.parent;
    }

    public Span getSpan() {
        return this.span;
    }

    public abstract String format();

    public abstract void transform(ASTTransformer t);

    public Optional<ASTElement> findName(String name) {
        if (this.parent != null) {
            return parent.findName(name);
        }
        return Optional.empty();
    }

    public String getPath() {
        String parent_path = "";
        if (this.parent != null) {
            parent_path = this.parent.getPath() + ".";
        }

        if (this instanceof NamedElement) {
            NamedElement as_named = (NamedElement) this;
            return parent_path + as_named.getName();
        } else {
            return parent_path + "__anon";
        }
    }

    public Optional<ASTElement> resolveName(String name) {
        for (String prefix : this.getSearchPath()) {
            Optional<ASTElement> rc = this.resolveNameInt(prefix + name);
            if (rc.isPresent()) {
                return rc;
            }
        }
        return Optional.empty();
    }

    Optional<ASTElement> resolveNameInt(String name) {
        if (this instanceof NameHolder) {
            return ((NameHolder) this).getPath(name).or(() -> {
                if (this.parent == null) {
                    return Optional.empty();
                } else {
                    return this.parent.resolveNameInt(name);
                }
            });
        } else {
            return this.parent.resolveNameInt(name);
        }
    }

    public List<String> getSearchPath() {
        ArrayList<String> rc = new ArrayList<String>();
        rc.add("");
        rc.add("lib.");
        return rc;
    }
}
