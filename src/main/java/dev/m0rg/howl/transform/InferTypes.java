package dev.m0rg.howl.transform;

import java.util.Optional;
import java.util.Map.Entry;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.HasUpstreamFields;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.NewType;
import dev.m0rg.howl.ast.type.algebraic.ABaseType;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.ast.type.algebraic.AVariable;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;
import dev.m0rg.howl.ast.type.algebraic.Applicable;
import dev.m0rg.howl.logger.Logger;

public class InferTypes implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof HasUpstreamFields) {
            Logger.trace("InferTypes: " + e.formatForLog());
            HasUpstreamFields holder = (HasUpstreamFields) e;
            for (Entry<String, FieldHandle> f : holder.getUpstreamFields().entrySet()) {
                // Logger.trace(f.getKey());
                AVariable.reset();
                ALambdaTerm t_expected = ALambdaTerm.evaluate(f.getValue().getExpectedType());
                ALambdaTerm t_provided = ALambdaTerm.evaluate(AlgebraicType.deriveNew(f.getValue().getSubexpression()));

                setEqual(t_expected, t_provided, e);
            }
            return e;
        } else {
            return e;
        }
    }

    void setEqual(ALambdaTerm expected, ALambdaTerm provided, ASTElement e) {
        Logger.trace(expected.format() + " <- " + provided.format());
        if (expected instanceof AVariable && !(provided instanceof AVariable)) {
            Optional<ASTElement> res = e.resolveName(((AVariable) expected).getName());
            if (res.isPresent()) {
                NewType t = (NewType) res.get();
                t.setResolution(provided);
            }
        } else if (expected instanceof AStructureReference && provided instanceof AStructureReference) {
            for (Entry<String, ALambdaTerm> s : ((AStructureReference) expected).getSubstitutions().entrySet()) {
                setEqual(s.getValue(),
                        ((AStructureReference) provided).getSubstitutions().get(s.getKey()), e);
            }
        }
    }
}
