package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class Interface extends ASTElement implements NamedElement, NameHolder {
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
    public ASTElement detach() {
        Interface rc = new Interface(span, name, new ArrayList<>(generics));
        for (Function method : methods) {
            rc.insertMethod((Function) method.detach());
        }
        return rc;
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
        this.methods.add((Function) method.setParent(this));
    }

    public void transform(ASTTransformer t) {
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

    public Optional<ASTElement> getChild(String name) {
        for (Function e : this.methods) {
            if (e.getName() == name) {
                return Optional.of(e);
            }
        }
        return Optional.empty();
    }
}
