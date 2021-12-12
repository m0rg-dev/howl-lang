package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.TypeElement;

public class InferGenerics implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof NamedType) {
            NamedType nt = (NamedType) e;
            TypeElement resolution = nt.resolve();
        }
        return e;
    }
}
