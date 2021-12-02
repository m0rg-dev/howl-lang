package dev.m0rg.howl.ast;

import java.util.LinkedHashMap;
import java.util.Map.Entry;

public class Class extends ASTElement {
    String name;
    LinkedHashMap<String, TypeElement> fields;

    public Class(Span span, String name) {
        super(span);
        this.name = name;
        this.fields = new LinkedHashMap<String, TypeElement>();
    }

    public String format() {
        StringBuilder rc = new StringBuilder();
        rc.append("class ");
        rc.append(name);
        rc.append(" {\n");
        for (Entry<String, TypeElement> field : fields.entrySet()) {
            rc.append("  " + field.getKey() + " " + field.getValue().format() + ";\n");
        }
        rc.append("}");
        return rc.toString();
    }

    public Class setField(String name, TypeElement contents) {
        contents.assertInsertable();
        ASTElement associated = contents.setParent(this);
        if (associated instanceof TypeElement) {
            this.fields.put(name, (TypeElement) associated);
        } else {
            throw new RuntimeException("can't happen");
        }
        return this;
    }
}
