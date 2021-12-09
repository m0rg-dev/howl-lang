package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public class Interface extends ASTElement implements NamedElement, NameHolder, HasOwnType {
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
        List<Argument> args = method.getArgumentList();
        StringBuilder mangled_name = new StringBuilder("_Z");
        mangled_name.append(method.getOriginalName().length());
        mangled_name.append(method.getOriginalName());
        mangled_name.append(args.size());
        mangled_name.append("E");
        for (Argument f : args) {
            mangled_name.append(f.getOwnType().mangle());
        }
        method.setName(mangled_name.toString());
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
        if (name.equals("Self")) {
            return Optional.of(this);
        }

        for (Function e : this.methods) {
            if (e.getName().equals(name)) {
                return Optional.of(e);
            }
        }
        return Optional.empty();
    }

    public List<String> getMethodNames() {
        Set<String> names = new HashSet<>();
        for (Function m : methods) {
            names.add(m.getName());
        }
        return new ArrayList<>(names);
    }

    public Optional<Function> getMethod(String name) {
        for (Function m : methods) {
            if (m.getName().equals(name)) {
                return Optional.of(m);
            }
        }
        return Optional.empty();
    }

    public List<Function> getOverloadCandidates(String name) {
        List<Function> rc = new ArrayList<>();
        for (Function m : methods) {
            if (m.getOriginalName().equals(name)) {
                rc.add(m);
            }
        }
        return rc;
    }

    @Override
    public InterfaceType getOwnType() {
        return (InterfaceType) new InterfaceType(span, this.getPath()).setParent(this);
    }

    public InterfaceStaticType getStaticType() {
        return (InterfaceStaticType) new InterfaceStaticType(span, this.getPath()).setParent(this);
    }
}
