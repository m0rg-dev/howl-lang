package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.AssignmentStatement;
import dev.m0rg.howl.ast.Expression;
import dev.m0rg.howl.ast.FieldReferenceExpression;
import dev.m0rg.howl.ast.FunctionCallExpression;
import dev.m0rg.howl.ast.IndexExpression;
import dev.m0rg.howl.ast.RawPointerType;
import dev.m0rg.howl.ast.SimpleStatement;
import dev.m0rg.howl.ast.TypeElement;

public class ConvertIndexLvalue implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof AssignmentStatement) {
            AssignmentStatement as_assignment = (AssignmentStatement) e;
            if (as_assignment.getLHS() instanceof IndexExpression) {
                IndexExpression as_index = (IndexExpression) as_assignment.getLHS();
                TypeElement source_type = as_index.getSource().getResolvedType();
                if (source_type instanceof RawPointerType) {
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
