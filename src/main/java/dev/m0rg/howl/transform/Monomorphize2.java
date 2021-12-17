package dev.m0rg.howl.transform;

import java.io.IOException;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;

import dev.m0rg.howl.CompilationError;
import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.expression.SpecifiedTypeExpression;
import dev.m0rg.howl.ast.type.SpecifiedType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.ast.type.algebraic.AVariable;
import dev.m0rg.howl.logger.Logger;

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
                for (Entry<String, ALambdaTerm> s : as_ref.getSubstitutions().entrySet()) {
                    if (s.getValue() instanceof AVariable) {
                        return e;
                    }
                }
                if (as_ref.getSource().getSource().getGenericNames().size() != as_ref.getSubstitutions().size()) {
                    try {
                        System.out.println(
                                new CompilationError(e.getSpan(), "generic mismatch " + as_ref.format()).format());
                    } catch (IOException ex) {
                        ;
                    }
                    throw new RuntimeException();
                }

                if (as_ref.getSubstitutions().size() > 0) {
                    Logger.trace("Monomorphize2: " + t.format());
                    for (Entry<String, ALambdaTerm> s : as_ref.getSubstitutions().entrySet()) {
                        if (!ALambdaTerm.evaluate(s.getValue()).freeVariables().isEmpty()) {
                            Logger.trace("   => not complete.");
                            return e;
                        }
                    }
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
