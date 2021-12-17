package dev.m0rg.howl.ast.statement;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.NameHolder;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.llvm.LLVMFunction;

public class CompoundStatement extends Statement implements NameHolder {
    List<Statement> statements;

    public static Set<CompoundStatement> all_compounds = new HashSet<>();

    public CompoundStatement(Span span) {
        super(span);
        statements = new ArrayList<Statement>();
        all_compounds.add(this);
    }

    @Override
    public ASTElement detach() {
        CompoundStatement rc = new CompoundStatement(span);
        for (Statement s : statements) {
            rc.insertStatement((Statement) s.detach());
        }
        return rc;
    }

    @Override
    public String format() {
        List<String> contents = new ArrayList<String>(this.statements.size());
        for (Statement s : this.statements) {
            contents.add(s.format());
        }
        return "{\n" + String.join("\n", contents).indent(2) + "}";
    }

    public void clear() {
        this.statements.clear();
    }

    public void insertStatement(Statement statement) {
        this.statements.add((Statement) statement.setParent(this));
    }

    public List<Statement> getContents() {
        return Collections.unmodifiableList(statements);
    }

    public Optional<ASTElement> getChild(String name) {
        for (Statement s : this.statements) {
            if (s instanceof LocalDefinitionStatement) {
                LocalDefinitionStatement as_local = (LocalDefinitionStatement) s;
                if (as_local.getName().equals(name)) {
                    return Optional.of(as_local);
                }
            }
        }
        return Optional.empty();
    }

    public void transform(ASTTransformer t) {
        int index = 0;
        for (Statement statement : statements) {
            statement.transform(t);
            statements.set(index, (Statement) t.transform(statement).setParent(this));
            index++;
        }
    }

    @Override
    public void generate(LLVMFunction f) {
        for (Statement statement : statements) {
            statement.generate(f);
        }
    }
}
