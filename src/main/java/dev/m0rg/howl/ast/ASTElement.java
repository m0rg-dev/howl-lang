package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import dev.m0rg.howl.Compiler;
import dev.m0rg.howl.logger.Logger;

public abstract class ASTElement {
    ASTElement parent;
    protected Span span;
    ASTElement original;
    Optional<String> pathcache;

    public ASTElement(Span span) {
        this.span = span;
        this.pathcache = Optional.empty();
    }

    public ASTElement setParent(ASTElement parent) {
        if (this.parent == null || this.parent == parent) {
            this.parent = parent;
            pathcache = Optional.of(this.getPath_intern());
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

    /**
     * Sets this ASTElement's parent to null and returns it.
     *
     * <p>
     * 
     * <b>Potentially unsafe</b>: if you're using this function, you need to
     * make sure that the original element is removed from the tree, for
     * instance by attaching the returned element to a new element and replacing
     * the original element's parent with that new element.
     */
    public ASTElement detachUnsafe() {
        this.parent = null;
        return this;
    }

    public abstract String format();

    /**
     * Formats in a way that more closely represents the element in the original
     * source, even if that loses information.
     */
    public String formatPretty() {
        return format();
    }

    /**
     * Formats only if --trace was passed; otherwise, returns empty string.
     */
    public String formatForLog() {
        if (Compiler.cmd.hasOption("trace")) {
            return format();
        } else {
            return "";
        }
    }

    public abstract void transform(ASTTransformer t);

    public Optional<ASTElement> findName(String name) {
        if (this.parent != null) {
            return parent.findName(name);
        }
        return Optional.empty();
    }

    public static long pathcount = 0;
    public static long pathtime = 0;

    public String getPath() {
        pathcount++;
        long start = System.currentTimeMillis();
        String rc;
        if (pathcache.isPresent()) {
            rc = getPath_intern();
            if (!rc.equals(pathcache.get())) {
                Logger.trace("path cache bust " + pathcache.get() + " " + rc);
                pathcache = Optional.of(rc);
            }
        } else {
            rc = getPath_intern();
        }
        long end = System.currentTimeMillis();
        pathtime += (end - start);
        return rc;
    }

    String getPath_intern() {
        String parent_path = "";
        if (this.parent != null) {
            parent_path = this.parent.getPath_intern() + ".";
        }

        if (this instanceof NamedElement) {
            NamedElement as_named = (NamedElement) this;
            return parent_path + as_named.getName();
        } else {
            return parent_path + "_" + this.getClass().getSimpleName();
        }
    }

    public String getPathPretty() {
        String rc = getPath();
        return rc.replaceFirst("^root\\.", "");
    }

    public Optional<ASTElement> resolveName(String name) {
        for (String prefix : this.getSearchPath()) {
            Optional<ASTElement> rc = this.resolveNameInt((prefix + name).split("\\."));
            if (rc.isPresent()) {
                return rc;
            }
        }
        return Optional.empty();
    }

    Optional<ASTElement> resolveNameInt(String[] name) {
        if (name[0].equals("root") && this.parent == null) {
            return this.resolveNameInt(Arrays.copyOfRange(name, 1, name.length));
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

    public NameHolder nearestNameHolder() {
        if (this instanceof NameHolder)
            return (NameHolder) this;
        return this.parent.nearestNameHolder();
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

    public Optional<ASTElement> nearest(java.util.function.Function<ASTElement, Boolean> predicate) {
        if (predicate.apply(this)) {
            return Optional.of(this);
        } else if (this.parent != null) {
            return this.getParent().nearest(predicate);
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
