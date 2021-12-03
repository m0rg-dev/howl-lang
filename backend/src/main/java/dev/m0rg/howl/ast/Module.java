package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Module extends ASTElement implements NamedElement {
    String name;
    List<ASTElement> contents;

    public Module(String name) {
        super(null);
        this.name = name;
        this.contents = new ArrayList<ASTElement>();
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
        item.assertInsertable();
        this.contents.add(item.setParent(this));
    }

    public String getName() {
        return this.name;
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
}
