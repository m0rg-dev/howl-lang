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
import dev.m0rg.howl.ast.type.algebraic.ABaseType;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AVariable;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;

public class AddNumericCasts implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof HasUpstreamFields) {
            for (Entry<String, FieldHandle> ent : ((HasUpstreamFields) e).getUpstreamFields().entrySet()) {
                AVariable.reset();
                ALambdaTerm t_expected = ALambdaTerm.evaluate(ent.getValue().getExpectedType());
                ALambdaTerm t_provided = ALambdaTerm
                        .evaluate(AlgebraicType.derive(ent.getValue().getSubexpression()));

                // TODO sort this all out
                if (t_expected instanceof ABaseType && t_provided instanceof ABaseType) {
                    NamedType expected = NamedType.build(e.getSpan(), ((ABaseType) t_expected).getName());
                    NamedType provided = NamedType.build(e.getSpan(), ((ABaseType) t_provided).getName());

                    if (expected instanceof NumericType && provided instanceof NamedType) {
                        NumericType n_expected = (NumericType) expected;
                        NamedType n_provided = (NamedType) provided;
                        if (!n_expected.getName().equals(n_provided.getName())) {
                            NumericCastExpression nce = new NumericCastExpression(
                                    ent.getValue().getSubexpression().getSpan());
                            nce.setSource((Expression) ent.getValue().getSubexpression().detach());
                            nce.setTarget((ABaseType) t_expected);
                            ent.getValue().setSubexpression(nce);
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
