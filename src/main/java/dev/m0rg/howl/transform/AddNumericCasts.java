package dev.m0rg.howl.transform;

import java.util.Map.Entry;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.HasUpstreamFields;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.expression.NumericCastExpression;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.NumericType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.logger.Logger;

public class AddNumericCasts implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof HasUpstreamFields) {
            // for (Entry<String, FieldHandle> ent : ((HasUpstreamFields)
            // e).getUpstreamFields().entrySet()) {
            // TypeElement expected = ent.getValue().getExpectedType().resolve();
            // TypeElement provided = ent.getValue().getSubexpression().getResolvedType();
            // if (expected instanceof NumericType && provided instanceof NamedType) {
            // NumericType n_expected = (NumericType) expected;
            // NamedType n_provided = (NamedType) provided;
            // Logger.trace("AddNumericCasts " + ent.getValue().getSubexpression().format()
            // + " -> "
            // + expected.format());
            // if (!n_expected.getName().equals(n_provided.getName())) {
            // NumericCastExpression nce = new NumericCastExpression(
            // ent.getValue().getSubexpression().getSpan());
            // nce.setSource((Expression) ent.getValue().getSubexpression().detach());
            // nce.setTarget((TypeElement)
            // ent.getValue().getExpectedType().resolve().detach());
            // ent.getValue().setSubexpression(nce);
            // }
            // }
            // }
            return e;
        } else {
            return e;
        }
    }
}
