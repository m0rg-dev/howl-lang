package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Expression;
import dev.m0rg.howl.ast.FFICallExpression;
import dev.m0rg.howl.ast.FieldReferenceExpression;
import dev.m0rg.howl.ast.FunctionCallExpression;
import dev.m0rg.howl.ast.NameExpression;
import dev.m0rg.howl.ast.StringLiteral;

public class ConvertStrings implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof StringLiteral) {
            NameExpression source = new NameExpression(e.getSpan(), "root.lib.String");
            FieldReferenceExpression from_bytes = new FieldReferenceExpression(e.getSpan(), "fromBytes");
            from_bytes.setSource(source);
            FunctionCallExpression fb_call = new FunctionCallExpression(e.getSpan());
            fb_call.setSource(from_bytes);
            FFICallExpression strlen_call = new FFICallExpression(e.getSpan(), "strlen");
            strlen_call.insertArgument((Expression) e.detach());
            fb_call.insertArgument((Expression) e.detach());
            fb_call.insertArgument(strlen_call);
            return fb_call;
        } else {
            return e;
        }
    }
}
