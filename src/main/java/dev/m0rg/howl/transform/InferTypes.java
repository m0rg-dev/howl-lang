package dev.m0rg.howl.transform;

import java.util.Map.Entry;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.statement.Statement;
import dev.m0rg.howl.ast.type.iterative.Section;
import dev.m0rg.howl.ast.type.iterative.TypeObject;
import dev.m0rg.howl.logger.Logger;

public class InferTypes implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof Statement) {
            Section s = Section.derive((Statement) e);
            boolean noisy = ((Statement) e).getAnnotations().getOrDefault("debug", "").contains("dumptypes");

            if (noisy) {
                s.dump();
            }
            s.evaluate(noisy);
            if (noisy) {
                s.dump();
            }

            for (Entry<Expression, TypeObject> result : s.getEnvironment().entrySet()) {
                if (result.getValue().isSubstitutable(s.getEnvironment())) {
                    result.getKey().setResolvedType(result.getValue());
                } else {
                    Logger.trace("unresolved types " + e.format());
                    e.getSpan().addError("unresolved types");
                }
            }
        }
        return e;
    }
}
