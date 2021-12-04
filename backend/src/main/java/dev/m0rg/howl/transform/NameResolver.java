package dev.m0rg.howl.transform;

import java.util.ArrayList;
import java.util.List;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Expression;
import dev.m0rg.howl.ast.FieldReferenceExpression;
import dev.m0rg.howl.ast.NameExpression;

public class NameResolver implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof NameExpression) {
            NameExpression name_expression = (NameExpression) e;
            List<String> parts = new ArrayList<String>();

            for (String part : name_expression.getName().split("\\.")) {
                parts.add(part);
            }

            int split_point = parts.size();
            for (; split_point > 0; split_point--) {
                NameExpression test = new NameExpression(name_expression.getSpan(),
                        String.join(".", parts.subList(0, split_point)));
                test.setParent(name_expression.getParent());
                if (test.resolveName(test.getName()).isPresent()) {
                    break;
                }
            }

            Expression rc = new NameExpression(name_expression.getSpan(),
                    String.join(".", parts.subList(0, split_point)));

            if (!name_expression.resolveName(((NameExpression) rc).getName()).isPresent()) {
                throw new RuntimeException("TODO unresolved name");
            }

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
