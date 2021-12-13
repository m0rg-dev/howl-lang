package dev.m0rg.howl.transform;

import java.util.ArrayList;
import java.util.List;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.statement.CatchStatement;
import dev.m0rg.howl.ast.statement.CompoundStatement;
import dev.m0rg.howl.ast.statement.Statement;
import dev.m0rg.howl.ast.statement.TryStatement;
import dev.m0rg.howl.logger.Logger;

public class CoalesceCatch implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof CompoundStatement) {
            CompoundStatement rc = new CompoundStatement(e.getSpan());
            List<Statement> contents = ((CompoundStatement) e).getContents();
            if (contents.isEmpty())
                return e;
            List<Statement> new_contents = new ArrayList<>();
            new_contents.add((Statement) contents.get(0).detach());

            for (int i = 1, j = 1; i < contents.size(); i++) {
                Logger.trace("i " + contents.get(i).formatForLog());
                Logger.trace("j - 1 " + new_contents.get(j - 1).formatForLog());
                if (contents.get(i) instanceof CatchStatement) {
                    if (new_contents.get(j - 1) instanceof TryStatement) {
                        ((TryStatement) new_contents.get(j - 1))
                                .insertAlternative((CatchStatement) contents.get(i).detach());
                        Logger.trace("new " + new_contents.get(j - 1).formatForLog());
                    } else {
                        e.getSpan().addError("unattached catch statement");
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
