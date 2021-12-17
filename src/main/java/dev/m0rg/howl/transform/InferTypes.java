package dev.m0rg.howl.transform;

import java.io.IOException;
import java.util.Map.Entry;
import java.util.Optional;

import dev.m0rg.howl.CompilationError;
import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Class;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.HasUpstreamFields;
import dev.m0rg.howl.ast.type.NewType;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.ast.type.algebraic.AVariable;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;
import dev.m0rg.howl.logger.Logger;

public class InferTypes implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof HasUpstreamFields) {
            Logger.trace("InferTypes: " + e.formatForLog());
            HasUpstreamFields holder = (HasUpstreamFields) e;
            for (Entry<String, FieldHandle> f : holder.getUpstreamFields().entrySet()) {
                Logger.trace("key: " + f.getKey());
                AVariable.reset();
                ALambdaTerm t_expected = ALambdaTerm.evaluate(f.getValue().getExpectedType());
                Logger.trace(" " + f.getKey() + " expected: " + t_expected.format());
                ALambdaTerm t_provided = ALambdaTerm.evaluate(AlgebraicType.derive(f.getValue().getSubexpression()));
                Logger.trace(" " + f.getKey() + " provided: " + t_provided.format());

                if (t_expected.accepts(t_provided)) {
                    setEqual(t_expected, t_provided, e);
                } else {
                    try {
                        System.out.println(new CompilationError(e.getSpan(), "type mismatch").format());
                    } catch (IOException ex) {
                        ;
                    }
                    throw new RuntimeException("type mismatch: " + t_expected.format() + " <- " + t_provided.format());
                }
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
            AStructureReference s_expected = (AStructureReference) expected;
            AStructureReference s_provided = (AStructureReference) provided;
            if (s_provided.getSource().getSource().original != null) {
                return;
            }

            if (s_expected.getSource().getSource() instanceof Class
                    && s_provided.getSource().getSource() instanceof Class) {
                for (Entry<String, ALambdaTerm> s : s_expected.getSubstitutions().entrySet()) {
                    setEqual(s.getValue(),
                            s_provided.getSubstitutions().get(s.getKey()), e);
                }
            } else {
                // TODO
            }
        }
    }
}
