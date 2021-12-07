package dev.m0rg.howl.transform;

import java.util.Map.Entry;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.ClassType;
import dev.m0rg.howl.ast.Expression;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.InterfaceCastExpression;
import dev.m0rg.howl.ast.InterfaceType;
import dev.m0rg.howl.ast.TypeElement;
import dev.m0rg.howl.logger.Logger;

public class AddInterfaceCasts implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof Expression) {
            for (Entry<String, FieldHandle> ent : ((Expression) e).getUpstreamFields().entrySet()) {
                TypeElement expected = ent.getValue().getExpectedType().resolve();
                TypeElement provided = ent.getValue().getSubexpression().getResolvedType();
                if (expected instanceof InterfaceType && provided instanceof ClassType) {
                    Logger.trace("AddInterfaceCasts " + ent.getValue().getSubexpression().format() + " -> "
                            + expected.format());
                    InterfaceCastExpression ice = new InterfaceCastExpression(
                            ent.getValue().getSubexpression().getSpan());
                    ice.setSource((Expression) ent.getValue().getSubexpression().detach());
                    ice.setTarget((TypeElement) ent.getValue().getExpectedType().detach());
                    ent.getValue().setSubexpression(ice);
                }
            }
            return e;
        } else {
            return e;
        }
    }
}
