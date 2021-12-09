package dev.m0rg.howl.transform;

import java.util.ArrayList;
import java.util.List;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.statement.CompoundStatement;
import dev.m0rg.howl.ast.statement.ElseStatement;
import dev.m0rg.howl.ast.statement.IfStatement;
import dev.m0rg.howl.ast.statement.Statement;

public class CoalesceElse implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof CompoundStatement) {
            CompoundStatement rc = new CompoundStatement(e.getSpan());
            List<Statement> contents = ((CompoundStatement) e).getContents();
            if (contents.isEmpty())
                return e;
            List<Statement> new_contents = new ArrayList<>();
            new_contents.add((Statement) contents.get(0).detach());

            for (int i = 1, j = 1; i < contents.size(); i++) {
                if (contents.get(i) instanceof ElseStatement) {
                    if (new_contents.get(j - 1) instanceof IfStatement) {
                        ((IfStatement) new_contents.get(j - 1)).setAlternative(
                                (CompoundStatement) ((ElseStatement) contents.get(i)).getBody().detach());
                    } else {
                        throw new RuntimeException("COMPILATION-ERROR unattached else");
                    }
                } else {
                    new_contents.add((Statement) contents.get(i).detach());
                    j++;
                }
            }

            for (Statement s : new_contents) {
                rc.insertStatement(s);
            }

            return rc;
        }
        return e;
    }
}
