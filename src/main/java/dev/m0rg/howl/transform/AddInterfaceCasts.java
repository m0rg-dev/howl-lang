package dev.m0rg.howl.transform;

import java.util.Map.Entry;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.HasUpstreamFields;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.expression.FieldReferenceExpression;
import dev.m0rg.howl.ast.expression.FunctionCallExpression;
import dev.m0rg.howl.ast.expression.GetStaticTableExpression;
import dev.m0rg.howl.ast.expression.TemporaryExpression;
import dev.m0rg.howl.ast.type.ClassType;
import dev.m0rg.howl.ast.type.InterfaceType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.logger.Logger;

public class AddInterfaceCasts implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof HasUpstreamFields) {
            for (Entry<String, FieldHandle> ent : ((HasUpstreamFields) e).getUpstreamFields().entrySet()) {
                TypeElement expected = ent.getValue().getExpectedType().evaluate().toElement().resolve();
                TypeElement provided = ent.getValue().getSubexpression().getResolvedType();
                if (expected instanceof InterfaceType && provided instanceof ClassType) {
                    Logger.trace("AddInterfaceCasts " +
                            ent.getValue().getSubexpression().format() + " -> "
                            + expected.format());

                    InterfaceType it = (InterfaceType) expected;

                    TemporaryExpression t = new TemporaryExpression(e.getSpan());
                    t.setSource((Expression) ent.getValue().getSubexpression().detach());
                    // TODO this should be centralized
                    String name = "__as_" + it.getSource().getPath().replace('.', '_');
                    String mangled = "_Z" + name.length() + name + "1E4Self";
                    FieldReferenceExpression source = new FieldReferenceExpression(e.getSpan(),
                            mangled);
                    GetStaticTableExpression gste = new GetStaticTableExpression(e.getSpan());
                    source.setSource(gste);
                    gste.setSource((Expression) t.detach());
                    FunctionCallExpression fc = new FunctionCallExpression(e.getSpan());
                    fc.setSource(source);
                    fc.insertArgument(t);

                    ent.getValue().setSubexpression(fc);
                }
            }
            return e;
        } else {
            return e;
        }
    }
}
