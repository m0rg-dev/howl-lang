package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.logger.Logger;

public class EnsureTypesResolve implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof Expression) {
            boolean noisy = ((Expression) e).nearestStatement().getAnnotations().getOrDefault("debug", "")
                    .contains("dumptypes");
            if (noisy)
                Logger.trace("EnsureTypesResolve: dumptypes " + e.formatForLog());
            ALambdaTerm ty = ALambdaTerm.evaluateFrom(e, noisy);
            if (ty.freeVariables().size() > 0) {
                e.getSpan().addError("Unable to resolve type for expression", ty.format());
            }
        }
        return e;
    }
}
