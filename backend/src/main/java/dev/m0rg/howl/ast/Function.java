package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
import java.util.Map.Entry;

public class Function extends ASTElement implements NamedElement, NameHolder {
    boolean is_static;
    String name;
    TypeElement rc;
    LinkedHashMap<String, Field> args;
    Optional<CompoundStatement> body;

    public Function(Span span, boolean is_static, String name) {
        super(span);
        this.is_static = is_static;
        this.name = name;
        this.args = new LinkedHashMap<String, Field>();
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
        for (Entry<String, Field> field : args.entrySet()) {
            arg_strings.add(field.getValue().format());
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

    public void prependArgument(Field arg) {
        LinkedHashMap<String, Field> new_map = new LinkedHashMap<String, Field>();
        new_map.put(arg.getName(), (Field) arg.setParent(this));
        for (Entry<String, Field> field : args.entrySet()) {
            new_map.put(field.getKey(), field.getValue());
        }
        this.args = new_map;
    }

    public void insertArgument(Field arg) {
        this.args.put(arg.getName(), (Field) arg.setParent(this));
    }

    public void setReturn(TypeElement rc) {
        ASTElement associated = rc.setParent(this);
        this.rc = (TypeElement) associated;
    }

    public void setBody(CompoundStatement body) {
        ASTElement associated = body.setParent(this);
        this.body = Optional.of((CompoundStatement) associated);
    }

    public Optional<ASTElement> getChild(String name) {
        if (this.args.containsKey(name)) {
            return Optional.of(this.args.get(name));
        } else {
            return Optional.empty();
        }
    }

    public void transform(ASTTransformer t) {
        rc.transform(t);
        rc = t.transform(rc);

        for (Entry<String, Field> arg : args.entrySet()) {
            arg.getValue().transform(t);
            args.replace(arg.getKey(), (Field) t.transform(arg.getValue()).setParent(this));
        }

        if (this.body.isPresent()) {
            this.body.get().transform(t);
            this.setBody(t.transform(this.body.get()));
        }
    }
}
