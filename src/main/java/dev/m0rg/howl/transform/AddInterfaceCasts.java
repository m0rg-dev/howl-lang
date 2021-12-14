package dev.m0rg.howl.transform;

import java.util.Map.Entry;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.HasUpstreamFields;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.expression.FieldReferenceExpression;
import dev.m0rg.howl.ast.expression.FunctionCallExpression;
import dev.m0rg.howl.ast.type.ClassType;
import dev.m0rg.howl.ast.type.InterfaceType;
import dev.m0rg.howl.ast.type.ObjectReferenceType;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.ast.type.algebraic.AVariable;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;
import dev.m0rg.howl.logger.Logger;

public class AddInterfaceCasts implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof HasUpstreamFields) {
            for (Entry<String, FieldHandle> ent : ((HasUpstreamFields) e).getUpstreamFields().entrySet()) {
                AVariable.reset();
                ALambdaTerm t_expected = ALambdaTerm.evaluate(ent.getValue().getExpectedType());
                ALambdaTerm t_provided = ALambdaTerm
                        .evaluate(AlgebraicType.deriveNew(ent.getValue().getSubexpression()));

                if (t_expected instanceof AStructureReference && t_provided instanceof AStructureReference) {
                    ObjectReferenceType expected = ((AStructureReference) t_expected).getSource();
                    ObjectReferenceType provided = ((AStructureReference) t_provided).getSource();
                    if (expected instanceof InterfaceType && provided instanceof ClassType) {
                        Logger.trace("AddInterfaceCasts " +
                                ent.getValue().getSubexpression().formatForLog() + " -> "
                                + expected.formatForLog());

                        InterfaceType it = (InterfaceType) expected;

                        FieldReferenceExpression get_converter = new FieldReferenceExpression(e.getSpan(),
                                "__as_" + it.getSource().getPath().replace('.', '_'));
                        get_converter.setSource((Expression) ent.getValue().getSubexpression().detach());
                        FunctionCallExpression call_converter = new FunctionCallExpression(e.getSpan());
                        call_converter.setSource(get_converter);

                        ent.getValue().setSubexpression(call_converter);
                    }
                }
            }
            return e;
        } else {
            return e;
        }
    }
}
