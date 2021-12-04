package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

public class Module extends ASTElement implements NamedElement, NameHolder {
    String name;
    List<ASTElement> contents;

    public Module(String name) {
        super(null);
        this.name = name;
        this.contents = new ArrayList<ASTElement>();
    }

    @Override
    public ASTElement detach() {
        Module rc = new Module(name);
        for (ASTElement item : contents) {
            rc.insertItem(item.detach());
        }
        return rc;
    }

    @Override
    public String format() {
        List<String> contents = new ArrayList<String>(this.contents.size());
        for (ASTElement s : this.contents) {
            contents.add(s.format());
        }
        return "mod " + this.name + " {\n" + String.join("\n\n", contents).indent(2) + "}";
    }

    public void insertItem(ASTElement item) {
        this.contents.add(item.setParent(this));
    }

    public String getName() {
        return this.name;
    }

    public void setName(String name) {
        if (this.parent != null) {
            throw new RuntimeException("setting the name on an owned Module is a terrible idea");
        }
        this.name = name;
    }

    public Optional<ASTElement> getChild(String name) {
        for (ASTElement e : this.contents) {
            if (e instanceof NamedElement) {
                NamedElement as_named = (NamedElement) e;
                if (as_named.getName().equals(name)) {
                    return Optional.of(e);
                }
            }
        }
        return Optional.empty();
    }

    public void insertPath(String path, ASTElement item) {
        String[] parts = path.split("\\.");
        if (parts.length == 1) {
            this.insertItem(item);
        } else {
            for (ASTElement e : this.contents) {
                if (e instanceof NamedElement) {
                    NamedElement as_named = (NamedElement) e;
                    if (as_named.getName().equals(parts[0])) {
                        if (e instanceof Module) {
                            Module m = (Module) e;
                            m.insertPath(String.join(".", Arrays.copyOfRange(parts, 1, parts.length)), item);
                            return;
                        } else {
                            throw new RuntimeException("attempt to set path containing non-Module");
                        }
                    }
                }
            }

            Module new_module = new Module(parts[0]);
            new_module.insertPath(String.join(".", Arrays.copyOfRange(parts, 1, parts.length)), item);
            this.insertItem(new_module);
        }
    }

    public void transform(ASTTransformer t) {
        int index = 0;
        ASTElement[] contents = this.contents.toArray(new ASTElement[0]);
        for (ASTElement item : contents) {
            item.transform(t);
            this.contents.set(index, t.transform(item).setParent(this));
            index++;
        }
    }
}
