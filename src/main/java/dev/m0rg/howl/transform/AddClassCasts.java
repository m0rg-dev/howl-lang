package dev.m0rg.howl.transform;

import java.util.Map.Entry;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.HasUpstreamFields;
import dev.m0rg.howl.ast.expression.ClassCastExpression;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.type.ClassType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.logger.Logger;

public class AddClassCasts implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof HasUpstreamFields) {
            for (Entry<String, FieldHandle> ent : ((HasUpstreamFields) e).getUpstreamFields().entrySet()) {
                TypeElement expected = ent.getValue().getExpectedType().evaluate().toElement().resolve();
                TypeElement provided = ent.getValue().getSubexpression().getResolvedType();
                if (expected instanceof ClassType && provided instanceof ClassType) {
                    ClassType ct_expected = (ClassType) expected;
                    ClassType ct_provided = (ClassType) provided;
                    if (!ct_expected.getSource().getPath().equals(ct_provided.getSource().getPath())) {
                        Logger.trace("AddClassCasts " + ent.getValue().getSubexpression().format() +
                                " -> "
                                + expected.format());
                        ClassCastExpression ice = new ClassCastExpression(
                                ent.getValue().getSubexpression().getSpan());
                        ice.setSource((Expression) ent.getValue().getSubexpression().detach());
                        ice.setTarget((TypeElement) ent.getValue().getExpectedType().evaluate().toElement().detach());
                        ent.getValue().setSubexpression(ice);
                    }
                }
            }
            return e;
        } else {
            return e;
        }
    }
}
