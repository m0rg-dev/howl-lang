package dev.m0rg.howl.transform;

import java.util.Arrays;
import java.util.List;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.expression.FieldReferenceExpression;
import dev.m0rg.howl.ast.expression.NameExpression;

public class ResolveNames implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof NameExpression) {
            NameExpression name_expression = (NameExpression) e;
            List<String> parts = Arrays.asList(name_expression.getSplit());

            int split_point = parts.size();
            for (; split_point > 1; split_point--) {
                NameExpression test = new NameExpression(name_expression.getSpan(),
                        String.join(".", parts.subList(0, split_point)));
                test.setParent(name_expression.getParent());
                if (test.resolveName(test.getName()).isPresent()) {
                    break;
                }
            }

            if (split_point == 0) {
                e.getSpan().addError("unresolved name");
            }

            Expression rc = new NameExpression(name_expression.getSpan(),
                    String.join(".", parts.subList(0, split_point)));

            for (String remaining_part : parts.subList(split_point, parts.size())) {
                FieldReferenceExpression new_rc = new FieldReferenceExpression(rc.getSpan(), remaining_part);
                new_rc.setSource(rc);
                rc = new_rc;
            }

            return rc;
        } else {
            return e;
        }
    }
}
