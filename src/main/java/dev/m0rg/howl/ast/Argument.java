package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.List;

import dev.m0rg.howl.ast.type.TypeElement;

public class Argument extends Field {
    public Argument(Span span, String name) {
        super(span, name);
    }

    @Override
    public ASTElement detach() {
        Argument rc = new Argument(span, name);
        rc.setType((TypeElement) fieldtype.detach());
        return rc;
    }

    public static String formatList(List<Argument> l) {
        List<String> rc = new ArrayList<>(l.size());
        for (Argument a : l) {
            rc.add(a.format());
        }
        return String.join(", ", rc);
    }
}
