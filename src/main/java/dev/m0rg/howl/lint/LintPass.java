package dev.m0rg.howl.lint;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;

public abstract class LintPass implements ASTTransformer {
    public abstract void check(ASTElement e);

    public ASTElement transform(ASTElement e) {
        this.check(e);
        return e;
    }
}
