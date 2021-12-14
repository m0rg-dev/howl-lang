package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.expression.FieldReferenceExpression;
import dev.m0rg.howl.ast.expression.FunctionCallExpression;
import dev.m0rg.howl.ast.expression.GetStaticTableExpression;
import dev.m0rg.howl.ast.expression.TemporaryExpression;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;
import dev.m0rg.howl.logger.Logger;

public class IndirectMethodCalls implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof FunctionCallExpression) {
            Expression source = ((FunctionCallExpression) e).getSource();
            if (source instanceof FieldReferenceExpression) {
                FieldReferenceExpression frex = (FieldReferenceExpression) source;
                ALambdaTerm source_type = ALambdaTerm.evaluate(AlgebraicType.deriveNew(frex.getSource()));

                if (source_type instanceof AStructureReference) {
                    FunctionCallExpression new_tree = (FunctionCallExpression) e.detach();
                    FieldReferenceExpression new_fsource = (FieldReferenceExpression) frex.detach();
                    GetStaticTableExpression new_rsource = new GetStaticTableExpression(frex.getSpan());
                    TemporaryExpression temp = new TemporaryExpression(frex.getSource().getSpan());
                    temp.setSource((Expression) frex.getSource().detach());
                    new_rsource.setSource((Expression) temp.detach());
                    new_fsource.setSource(new_rsource);
                    new_tree.setSource(new_fsource);
                    new_tree.prependArgument((Expression) temp.detach());
                    new_tree.setParent(e.getParent());
                    Logger.trace("IndirectMethodCalls " + new_tree.formatForLog());
                    return new_tree;
                }
            }
            return e;
        } else {
            return e;
        }
    }
}
