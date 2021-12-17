package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;

public class MultiPass implements ASTTransformer {
    ASTTransformer[] passes;

    public MultiPass(ASTTransformer[] passes) {
        this.passes = passes;
    }

    public ASTElement transform(ASTElement e) {
        for (ASTTransformer pass : passes) {
            e = pass.transform(e);
        }
        return e;
    }
}
