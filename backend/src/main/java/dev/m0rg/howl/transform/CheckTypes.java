package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Expression;
import dev.m0rg.howl.logger.Logger;
import dev.m0rg.howl.logger.Logger.LogLevel;

public class CheckTypes implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof Expression) {
            Logger.log(LogLevel.Trace,
                    "CheckTypes: " + e.format() + " => " + ((Expression) e).getResolvedType().format());
            return e;
        } else {
            return e;
        }
    }
}
