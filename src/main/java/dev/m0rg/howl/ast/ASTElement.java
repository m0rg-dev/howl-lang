package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public abstract class ASTElement {
    ASTElement parent;
    protected Span span;
    ASTElement original;

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

    /**
     * Returns a copy of this ASTElement and its subtree with no parent set.
     */
    public abstract ASTElement detach();

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
            return parent_path + "_" + this.getClass().getSimpleName();
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
        if (name.startsWith("root.") && this.parent == null) {
            return this.resolveNameInt(name.replaceFirst("root\\.", ""));
        }

        if (this instanceof NameHolder) {
            return ((NameHolder) this).getPath(name).or(() -> {
                if (this.parent == null) {
                    return Optional.empty();
                } else {
                    return this.parent.resolveNameInt(name);
                }
            });
        } else {
            if (this.parent == null) {
                return Optional.empty();
            } else {
                return this.parent.resolveNameInt(name);
            }
        }
    }

    public Optional<Module> nearestModule() {
        if (this instanceof Module) {
            return Optional.of((Module) this);
        } else if (this.parent != null) {
            return this.getParent().nearestModule();
        } else {
            return Optional.empty();
        }
    }

    public Optional<ObjectCommon> nearestObject() {
        if (this instanceof ObjectCommon) {
            return Optional.of((ObjectCommon) this);
        } else if (this.parent != null) {
            return this.getParent().nearestObject();
        } else {
            return Optional.empty();
        }
    }

    public List<String> getSearchPath() {
        ArrayList<String> rc = new ArrayList<String>();
        rc.add("");
        rc.add("root.lib.");
        if (this.nearestModule().isPresent()) {
            rc.addAll(this.nearestModule().get().getImportedPaths());
        }
        return rc;
    }
}
