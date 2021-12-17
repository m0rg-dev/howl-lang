package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.expression.FieldReferenceExpression;
import dev.m0rg.howl.ast.expression.FunctionCallExpression;
import dev.m0rg.howl.ast.expression.IndexExpression;
import dev.m0rg.howl.ast.statement.AssignmentStatement;
import dev.m0rg.howl.ast.statement.SimpleStatement;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.ARawPointer;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;
import dev.m0rg.howl.logger.Logger;

public class ConvertIndexLvalue implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof AssignmentStatement) {
            Logger.trace("ConvertIndexLvalue " + e.format());
            AssignmentStatement as_assignment = (AssignmentStatement) e;
            if (as_assignment.getLHS() instanceof IndexExpression) {
                IndexExpression as_index = (IndexExpression) as_assignment.getLHS();
                ALambdaTerm source_type = ALambdaTerm.evaluate(AlgebraicType.derive(as_index.getSource()));
                if (source_type instanceof ARawPointer) {
                    // don't have to overload those!
                    return e;
                } else {
                    FunctionCallExpression call = new FunctionCallExpression(e.getSpan());
                    FieldReferenceExpression index = new FieldReferenceExpression(e.getSpan(), "__index__");
                    index.setSource((Expression) as_index.getSource().detach());
                    call.setSource(index);
                    call.insertArgument((Expression) as_index.getIndex().detach());
                    call.insertArgument((Expression) as_assignment.getRHS().detach());
                    SimpleStatement statement = new SimpleStatement(e.getSpan());
                    statement.setExpression(call);
                    return statement;
                }
            } else {
                return e;
            }
        } else {
            return e;
        }
    }
}
