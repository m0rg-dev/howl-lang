package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.statement.Statement;
import dev.m0rg.howl.ast.type.iterative.Section;

public class InferTypes implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof Statement) {
            Section s = Section.derive((Statement) e);
            boolean noisy = !s.isEmpty()
                    || ((Statement) e).getAnnotations().getOrDefault("debug", "").contains("dumptypes");

            if (noisy) {
                s.dump();
            }
            s.evaluate(noisy);
            if (noisy) {
                s.dump();
            }
        }
        return e;
    }
}
