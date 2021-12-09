package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.expression.FieldReferenceExpression;
import dev.m0rg.howl.ast.expression.FunctionCallExpression;
import dev.m0rg.howl.ast.expression.GetStaticTableExpression;
import dev.m0rg.howl.ast.expression.TemporaryExpression;
import dev.m0rg.howl.ast.type.ClassType;
import dev.m0rg.howl.ast.type.InterfaceType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.logger.Logger;

public class IndirectMethodCalls implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof FunctionCallExpression) {
            Expression source = ((FunctionCallExpression) e).getSource();
            if (source instanceof FieldReferenceExpression) {
                FieldReferenceExpression frex = (FieldReferenceExpression) source;
                TypeElement source_type = frex.getSource().getResolvedType();
                if (source_type instanceof ClassType || source_type instanceof InterfaceType) {
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
                    Logger.trace("IndirectMethodCalls " + new_tree.format());
                    return resolveOverloads(new_tree);
                }
            }
            return resolveOverloads(e);
        } else {
            return e;
        }
    }

    static ASTElement resolveOverloads(ASTElement e) {
        ASTElement rc = (new ResolveOverloads()).transform(e);
        Logger.trace(" --- ");
        return rc;
    }
}
