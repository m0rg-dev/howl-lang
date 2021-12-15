package dev.m0rg.howl.transform;

import java.util.Map.Entry;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.HasUpstreamFields;
import dev.m0rg.howl.ast.expression.ClassCastExpression;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.type.ClassType;
import dev.m0rg.howl.ast.type.ObjectReferenceType;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.ast.type.algebraic.AVariable;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;
import dev.m0rg.howl.logger.Logger;

public class AddClassCasts implements ASTTransformer {
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
                    if (expected instanceof ClassType && provided instanceof ClassType) {
                        ClassType ct_expected = (ClassType) expected;
                        ClassType ct_provided = (ClassType) provided;
                        if (!ct_expected.getSource().getPath().equals(ct_provided.getSource().getPath())) {
                            Logger.trace("AddClassCasts " + ent.getValue().getSubexpression().formatForLog() +
                                    " -> "
                                    + expected.formatForLog());
                            ClassCastExpression ice = new ClassCastExpression(
                                    ent.getValue().getSubexpression().getSpan());
                            ice.setSource((Expression) ent.getValue().getSubexpression().detach());
                            ice.setTarget(t_expected);
                            ent.getValue().setSubexpression(ice);
                        }
                    }
                }
            }
            return e;
        } else {
            return e;
        }
    }
}
