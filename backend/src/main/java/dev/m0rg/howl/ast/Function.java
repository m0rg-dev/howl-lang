package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
import java.util.Map.Entry;

public class Function extends ASTElement implements NamedElement {
    boolean is_static;
    String name;
    TypeElement rc;
    LinkedHashMap<String, TypeElement> args;
    Optional<CompoundStatement> body;

    public Function(Span span, boolean is_static, String name) {
        super(span);
        this.is_static = is_static;
        this.name = name;
        this.args = new LinkedHashMap<String, TypeElement>();
        this.body = Optional.empty();
    }

    public String format() {
        StringBuilder rc = new StringBuilder();
        if (this.is_static) {
            rc.append("static ");
        }
        rc.append("fn ");
        rc.append(this.rc.format() + " ");
        rc.append(this.name);
        rc.append("(");

        List<String> arg_strings = new ArrayList<String>(this.args.size());
        for (Entry<String, TypeElement> field : args.entrySet()) {
            arg_strings.add(field.getValue().format() + " " + field.getKey());
        }
        rc.append(String.join(", ", arg_strings));
        rc.append(") ");

        if (this.body.isPresent()) {
            rc.append(this.body.get().format());
        } else {
            rc.append(";");
        }
        return rc.toString();
    }

    public String getName() {
        return name;
    }

    public void insertArgument(String name, TypeElement contents) {
        contents.assertInsertable();
        ASTElement associated = contents.setParent(this);
        this.args.put(name, (TypeElement) associated);
    }

    public void setReturn(TypeElement rc) {
        rc.assertInsertable();
        ASTElement associated = rc.setParent(this);
        this.rc = (TypeElement) associated;
    }

    public void setBody(CompoundStatement body) {
        body.assertInsertable();
        ASTElement associated = body.setParent(this);
        this.body = Optional.of((CompoundStatement) associated);
    }
}
