package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.expression.ArithmeticExpression;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.expression.FieldReferenceExpression;
import dev.m0rg.howl.ast.expression.FunctionCallExpression;
import dev.m0rg.howl.ast.expression.IndexExpression;
import dev.m0rg.howl.ast.type.NumericType;
import dev.m0rg.howl.ast.type.RawPointerType;
import dev.m0rg.howl.ast.type.TypeElement;

public class ConvertCustomOverloads implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof IndexExpression) {
            IndexExpression as_index = (IndexExpression) e;
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
                return call;
            }
        } else if (e instanceof ArithmeticExpression) {
            ArithmeticExpression as_math = (ArithmeticExpression) e;
            TypeElement lhs_type = as_math.getLHS().getResolvedType();
            if (lhs_type instanceof NumericType) {
                return e;
            } else {
                if (as_math.getOperator().equals("+")) {
                    FunctionCallExpression call = new FunctionCallExpression(e.getSpan());
                    FieldReferenceExpression add = new FieldReferenceExpression(e.getSpan(), "__add__");
                    add.setSource((Expression) as_math.getLHS().detach());
                    call.setSource(add);
                    call.insertArgument((Expression) as_math.getRHS().detach());
                    return call;
                } else {
                    return e;
                }
            }
        } else {
            return e;
        }
    }
}
