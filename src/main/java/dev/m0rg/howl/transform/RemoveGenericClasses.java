package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Module;

public class RemoveGenericClasses implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof Module) {
            Module m = (Module) e;
            m.dropGenerics();
            return e;
        } else {
            return e;
        }
    }

}
