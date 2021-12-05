package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.ClassType;
import dev.m0rg.howl.ast.Expression;
import dev.m0rg.howl.ast.FieldReferenceExpression;
import dev.m0rg.howl.ast.FunctionCallExpression;
import dev.m0rg.howl.ast.GetStaticTableExpression;
import dev.m0rg.howl.ast.TemporaryExpression;
import dev.m0rg.howl.ast.TypeElement;

public class IndirectMethodCalls implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof FunctionCallExpression) {
            Expression source = ((FunctionCallExpression) e).getSource();
            if (source instanceof FieldReferenceExpression) {
                FieldReferenceExpression frex = (FieldReferenceExpression) source;
                TypeElement source_type = frex.getSource().getResolvedType();
                if (source_type instanceof ClassType) {
                    FunctionCallExpression new_tree = (FunctionCallExpression) e.detach();
                    FieldReferenceExpression new_fsource = (FieldReferenceExpression) frex.detach();
                    GetStaticTableExpression new_rsource = new GetStaticTableExpression(frex.getSpan());
                    TemporaryExpression temp = new TemporaryExpression(frex.getSource().getSpan());
                    temp.setSource((Expression) frex.getSource().detach());
                    new_rsource.setSource((Expression) temp.detach());
                    new_fsource.setSource(new_rsource);
                    new_tree.setSource(new_fsource);
                    new_tree.prependArgument((Expression) temp.detach());
                    return new_tree;
                }
            }
            return e;
        } else {
            return e;
        }
    }
}
