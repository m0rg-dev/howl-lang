package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.expression.ArithmeticExpression;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.expression.FieldReferenceExpression;
import dev.m0rg.howl.ast.expression.FunctionCallExpression;
import dev.m0rg.howl.ast.expression.IndexExpression;
import dev.m0rg.howl.ast.type.algebraic.ABaseType;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.ARawPointer;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;

public class ConvertCustomOverloads implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof IndexExpression) {
            IndexExpression as_index = (IndexExpression) e;
            ALambdaTerm source_type = ALambdaTerm.evaluate(AlgebraicType.deriveNew(as_index.getSource()));
            if (source_type instanceof ARawPointer) {
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
            ALambdaTerm lhs_type = ALambdaTerm.evaluate(AlgebraicType.deriveNew(as_math.getLHS()));

            if (lhs_type instanceof ABaseType) {
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
