package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.List;
import java.util.Map.Entry;
import java.util.Optional;

import dev.m0rg.howl.ast.type.InterfaceType;
import dev.m0rg.howl.ast.type.NewType;

public class Interface extends ObjectCommon {
    public Interface(Span span, Span header_span, String name, List<String> generics, boolean _a) {
        super(span, header_span, name, generics);
    }

    public Interface(Span span, Span header_span, String name, List<ASTElement> generics) {
        super(span, header_span, name, generics.stream().map(x -> {
            if (x instanceof Identifier) {
                return ((Identifier) x).getName();
            } else {
                throw new RuntimeException();
            }
        }).toList());
    }

    @Override
    public ASTElement detach() {
        Interface rc = new Interface(span, header_span, name, new ArrayList<>(generics), true);
        for (Function method : methods) {
            rc.insertMethodUnchecked((Function) method.detach());
        }

        rc.original = original;

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

        rc.append(" {\n");
        for (Entry<String, NewType> generic : generic_types.entrySet()) {
            rc.append("  " + generic.getValue().format() + ";\n");
        }
        for (Function method : methods) {
            rc.append("\n" + method.format().indent(2));
        }

        rc.append("}");
        return rc.toString();
    }

    public void transform(ASTTransformer t) {
        int index = 0;
        for (Function method : methods) {
            method.transform(t);
            methods.set(index, (Function) t.transform(method).setParent(this));
            index++;
        }
    }

    @Override
    public InterfaceType getOwnType() {
        return (InterfaceType) new InterfaceType(span, this.getPath()).setParent(this);
    }

    @Override
    public void insertField(Field contents) {
        throw new UnsupportedOperationException();
    }

    @Override
    public Optional<Field> getField(String name) {
        return Optional.empty();
    }

    @Override
    public List<String> getFieldNames() {
        return new ArrayList<>();
    }
}
