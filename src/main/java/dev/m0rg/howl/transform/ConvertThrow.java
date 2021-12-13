package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.expression.FunctionCallExpression;
import dev.m0rg.howl.ast.expression.NameExpression;
import dev.m0rg.howl.ast.statement.SimpleStatement;
import dev.m0rg.howl.ast.statement.ThrowStatement;

public class ConvertThrow implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof ThrowStatement) {
            ThrowStatement as_throw = (ThrowStatement) e;
            SimpleStatement rc = new SimpleStatement(e.getSpan());
            NameExpression intern_throw = new NameExpression(e.getSpan(), "lib.Exception.__exc_throw");
            FunctionCallExpression throw_call = new FunctionCallExpression(e.getSpan());
            throw_call.setSource(intern_throw);
            throw_call.insertArgument((Expression) as_throw.getSource().detach());
            throw_call.isGeneratedFromThrow = !as_throw.isInternalRethrow;
            rc.setExpression(throw_call);
            return rc;
        } else {
            return e;
        }
    }
}
