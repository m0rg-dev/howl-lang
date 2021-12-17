package dev.m0rg.howl.transform;

import java.util.Arrays;
import java.util.List;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.expression.FieldReferenceExpression;
import dev.m0rg.howl.ast.expression.NameExpression;
import dev.m0rg.howl.ast.expression.SuperCastExpression;

public class ConvertSuper implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof NameExpression) {
            NameExpression ne = (NameExpression) e;
            if (ne.getName().startsWith("super")) {
                String rest = ne.getName().replaceFirst("super\\.?", "");
                if (rest.length() > 0) {
                    List<String> parts = Arrays.asList(rest.split("\\."));

                    Expression rc = new SuperCastExpression(e.getSpan());

                    for (String remaining_part : parts) {
                        FieldReferenceExpression new_rc = new FieldReferenceExpression(rc.getSpan(), remaining_part);
                        new_rc.setSource(rc);
                        rc = new_rc;
                    }

                    return rc;
                } else {
                    return new SuperCastExpression(e.getSpan());
                }
            } else {
                return e;
            }
        } else {
            return e;
        }
    }
}
