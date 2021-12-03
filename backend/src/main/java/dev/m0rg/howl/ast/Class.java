package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map.Entry;

public class Class extends ASTElement implements NamedElement {
    String name;
    List<String> generics;
    LinkedHashMap<String, TypeElement> fields;
    List<Function> methods;

    public Class(Span span, String name, List<String> generics) {
        super(span);
        this.name = name;
        this.generics = generics;
        this.fields = new LinkedHashMap<String, TypeElement>();
        this.methods = new ArrayList<Function>();
    }

    public String format() {
        StringBuilder rc = new StringBuilder();
        rc.append("class ");
        rc.append(name);

        if (!this.generics.isEmpty()) {
            rc.append("<");
            rc.append(String.join(",", this.generics));
            rc.append(">");
        }

        rc.append(" {\n");
        for (Entry<String, TypeElement> field : fields.entrySet()) {
            rc.append("  " + field.getValue().format() + " " + field.getKey() + ";\n");
        }

        for (Function method : methods) {
            rc.append("\n" + method.format().indent(2));
        }

        rc.append("}");
        return rc.toString();
    }

    public void insertField(String name, TypeElement contents) {
        this.fields.put(name, (TypeElement) contents.setParent(this));
    }

    public void insertMethod(Function method) {
        this.methods.add((Function) method.setParent(this));
    }

    public void transform(ASTTransformer t) {
        for (Entry<String, TypeElement> field : fields.entrySet()) {
            field.getValue().transform(t);
            fields.replace(field.getKey(), (TypeElement) t.transform(field.getValue()).setParent(this));
        }

        int index = 0;
        for (Function method : methods) {
            method.transform(t);
            methods.set(index, (Function) t.transform(method).setParent(this));
            index++;
        }
    }

    public String getName() {
        return this.name;
    }
}
