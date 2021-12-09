package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.expression.FieldReferenceExpression;
import dev.m0rg.howl.ast.expression.FunctionCallExpression;
import dev.m0rg.howl.ast.expression.NameExpression;
import dev.m0rg.howl.ast.expression.NumberExpression;
import dev.m0rg.howl.ast.expression.StringLiteral;

public class ConvertStrings implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof StringLiteral) {
            NameExpression source = new NameExpression(e.getSpan(), "root.lib.String");
            FieldReferenceExpression from_bytes = new FieldReferenceExpression(e.getSpan(), "fromBytes");
            from_bytes.setSource(source);
            FunctionCallExpression fb_call = new FunctionCallExpression(e.getSpan());
            fb_call.setSource(from_bytes);
            fb_call.insertArgument((Expression) e.detach());
            fb_call.insertArgument(new NumberExpression(e.getSpan(), "" + ((StringLiteral) e).real_string().length()));
            return fb_call;
        } else {
            return e;
        }
    }
}
