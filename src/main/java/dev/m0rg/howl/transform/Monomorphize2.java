package dev.m0rg.howl.transform;

import java.io.IOException;
import java.util.Map.Entry;

import dev.m0rg.howl.CompilationError;
import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.expression.SpecifiedTypeExpression;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.ast.type.algebraic.AVariable;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;
import dev.m0rg.howl.logger.Logger;

public class Monomorphize2 implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        // little bit of jank here to avoid blowing up on Option::<T> etc
        if (e instanceof Expression && !(e.getParent() instanceof SpecifiedTypeExpression)) {
            AVariable.reset();
            ALambdaTerm t = ALambdaTerm.evaluate(AlgebraicType.deriveNew(e));
            if (t instanceof AStructureReference) {
                AStructureReference as_ref = (AStructureReference) t;
                for (Entry<String, ALambdaTerm> s : as_ref.getSubstitutions().entrySet()) {
                    if (s.getValue() instanceof AVariable) {
                        return e;
                    }
                }
                if (as_ref.getSource().getSource().getGenericNames().size() != as_ref.getSubstitutions().size()) {
                    try {
                        System.out.println(new CompilationError(e.getSpan(), "type mismatch").format());
                    } catch (IOException ex) {
                        ;
                    }
                    throw new RuntimeException();
                }

                if (as_ref.getSubstitutions().size() > 0) {
                    Logger.trace("Monomorphize2: " + t.format());
                }
            }
        }
        return e;
    }
}
