package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.List;

public class Interface extends ASTElement implements NamedElement {
    String name;
    List<String> generics;
    List<Function> methods;

    public Interface(Span span, String name, List<String> generics) {
        super(span);
        this.name = name;
        this.generics = generics;
        this.methods = new ArrayList<Function>();
    }

    @Override
    public String format() {
        StringBuilder rc = new StringBuilder();
        rc.append("interface ");
        rc.append(name);

        if (!this.generics.isEmpty()) {
            rc.append("<");
            rc.append(String.join(",", this.generics));
            rc.append(">");
        }

        rc.append(" {");
        for (Function method : methods) {
            rc.append("\n" + method.format().indent(2));
        }

        rc.append("}");
        return rc.toString();
    }

    public void insertMethod(Function method) {
        method.assertInsertable();
        this.methods.add((Function) method.setParent(this));
    }

    public String getName() {
        return this.name;
    }
}
