package dev.m0rg.howl.transform;

import java.util.Map.Entry;

import dev.m0rg.howl.CompilationError;
import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Expression;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.TypeElement;
import dev.m0rg.howl.logger.Logger;

public class CheckTypes implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof Expression) {
            Logger.trace("CheckTypes: " + e.format());
            for (Entry<String, FieldHandle> ent : ((Expression) e).getUpstreamFields().entrySet()) {
                TypeElement expected = ent.getValue().getExpectedType().resolve();
                TypeElement provided = ent.getValue().getSubexpression().getResolvedType();
                Logger.trace(
                        "  " + ent.getKey() + " " + expected.format() + " <- "
                                + provided.format());
                if (!expected.accepts(provided)) {
                    e.getSpan().context.addError(new CompilationError(ent.getValue().getSubexpression().getSpan(),
                            "Type mismatch: expected: " + expected.format() + ", got: " + provided.format()));
                }
            }
            return e;
        } else {
            return e;
        }
    }
}
