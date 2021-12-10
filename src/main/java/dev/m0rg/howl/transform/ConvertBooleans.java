package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.expression.BooleanConstantExpression;
import dev.m0rg.howl.ast.expression.NameExpression;

public class ConvertBooleans implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof NameExpression) {
            NameExpression ne = (NameExpression) e;
            if (ne.getName().equals("true")) {
                return new BooleanConstantExpression(e.getSpan(), true);
            } else if (ne.getName().equals("false")) {
                return new BooleanConstantExpression(e.getSpan(), false);
            } else {
                return e;
            }
        } else {
            return e;
        }
    }
}
