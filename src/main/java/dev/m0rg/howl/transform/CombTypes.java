package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.type.NewType;
import dev.m0rg.howl.ast.type.TypeElement;

// TODO: Figure out why this needs to be a thing.
//
// Basically, we end up with nested NewTypes coming out of InferTypes because
// the  *alternative* is NamedType -> NewType cycles when you have a generic
// type cycle, but I don't think this is the right solution and it can probably
// cause trouble. Maybe something for the next (next, next...) type system
// reorg...
public class CombTypes implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        return e;
    }
}
