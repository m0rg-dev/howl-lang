package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.List;

public class CompoundStatement extends Statement {
    List<Statement> statements;

    public CompoundStatement(Span span) {
        super(span);
        statements = new ArrayList<Statement>();
    }

    @Override
    public String format() {
        List<String> contents = new ArrayList<String>(this.statements.size());
        for (Statement s : this.statements) {
            contents.add(s.format());
        }
        return "{\n" + String.join("\n", contents).indent(2) + "}";
    }

    public void insertStatement(Statement statement) {
        statement.assertInsertable();
        this.statements.add((Statement) statement.setParent(this));
    }
}
