package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.logger.Logger;
import dev.m0rg.howl.logger.Logger.LogLevel;

public class TestTransformer implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        Logger.log(LogLevel.Trace, "TestTransformer " + e.getClass().getName());
        return e;
    }
}
