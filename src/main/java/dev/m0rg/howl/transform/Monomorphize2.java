package dev.m0rg.howl.transform;

import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.expression.SpecifiedTypeExpression;
import dev.m0rg.howl.ast.type.SpecifiedType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.ast.type.algebraic.AVariable;

public class Monomorphize2 implements ASTTransformer {
    Map<String, AStructureReference> to_generate = new HashMap<>();

    public ASTElement transform(ASTElement e) {
        // little bit of jank here to avoid blowing up on Option::<T> etc
        if ((e instanceof Expression && !(e.getParent() instanceof SpecifiedTypeExpression))
                || (e instanceof TypeElement && !(e.getParent() instanceof SpecifiedType))) {
            AVariable.reset();
            ALambdaTerm t = ALambdaTerm.evaluateFrom(e);
            if (t instanceof AStructureReference) {
                AStructureReference as_ref = (AStructureReference) t;
                for (ALambdaTerm p : as_ref.getParameters()) {
                    if (!ALambdaTerm.evaluate(p).freeVariables().isEmpty()) {
                        return e;
                    }
                }

                if (as_ref.getParameters().size() == 0 || to_generate.containsKey(as_ref.mangle())) {
                    return e;
                }

                if (as_ref.getParameters().size() > 0) {
                    to_generate.put(as_ref.mangle(), as_ref);
                }
            }
        }
        return e;
    }

    public Collection<AStructureReference> getToGenerate() {
        return Collections.unmodifiableCollection(to_generate.values());
    }
}
