package dev.m0rg.howl.transform;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.statement.CatchStatement;
import dev.m0rg.howl.ast.statement.CompoundStatement;
import dev.m0rg.howl.ast.statement.ElseIfStatement;
import dev.m0rg.howl.ast.statement.ElseStatement;
import dev.m0rg.howl.ast.statement.IfStatement;
import dev.m0rg.howl.ast.statement.Statement;
import dev.m0rg.howl.ast.statement.TryStatement;

public class Coalesce {
    public void apply() {
        Set<CompoundStatement> statements = new HashSet<>(CompoundStatement.all_compounds);
        for (CompoundStatement s : statements) {
            transform(s);
        }
    }

    void transform(ASTElement e) {
        CompoundStatement rc = (CompoundStatement) e;
        List<Statement> contents = ((CompoundStatement) e).getContents();
        if (contents.isEmpty())
            return;
        List<Statement> new_contents = new ArrayList<>();
        new_contents.add((Statement) contents.get(0).detachUnsafe());

        for (int i = 1, j = 1; i < contents.size(); i++) {
            if (contents.get(i) instanceof ElseStatement) {
                if (new_contents.get(j - 1) instanceof IfStatement) {
                    ((IfStatement) new_contents.get(j - 1)).setAlternative(
                            (CompoundStatement) ((ElseStatement) contents.get(i)).getBody().detachUnsafe());
                } else {
                    throw new RuntimeException("COMPILATION-ERROR unattached else");
                }
            } else if (contents.get(i) instanceof ElseIfStatement) {
                if (new_contents.get(j - 1) instanceof IfStatement) {
                    ElseIfStatement else_if = (ElseIfStatement) contents.get(i);
                    IfStatement new_chain = new IfStatement(else_if.getSpan());
                    new_chain.setCondition((Expression) else_if.getCondition().detachUnsafe());
                    new_chain.setBody((CompoundStatement) else_if.getBody().detachUnsafe());
                    ((IfStatement) new_contents.get(j - 1)).setChain(
                            (IfStatement) new_chain.detachUnsafe());
                } else {
                    throw new RuntimeException("COMPILATION-ERROR unattached else if");
                }
            } else if (contents.get(i) instanceof CatchStatement) {
                if (new_contents.get(j - 1) instanceof TryStatement) {
                    ((TryStatement) new_contents.get(j - 1))
                            .insertAlternative((CatchStatement) contents.get(i).detachUnsafe());
                } else {
                    e.getSpan().addError("unattached catch statement");
                }
            } else {
                new_contents.add((Statement) contents.get(i).detachUnsafe());
                j++;
            }
        }

        rc.clear();
        for (Statement s : new_contents) {
            rc.insertStatement(s);
        }

    }
}
