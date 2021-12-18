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
import dev.m0rg.howl.ast.Interface;
import dev.m0rg.howl.ast.type.NewType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.ast.type.algebraic.AVariable;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;
import dev.m0rg.howl.logger.Logger;

public class InferTypes implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof HasUpstreamFields) {
            HasUpstreamFields holder = (HasUpstreamFields) e;
            for (Entry<String, FieldHandle> f : holder.getUpstreamFields().entrySet()) {
                AVariable.reset();
                ALambdaTerm t_expected = ALambdaTerm.evaluate(f.getValue().getExpectedType());
                ALambdaTerm t_provided = ALambdaTerm.evaluate(AlgebraicType.derive(f.getValue().getSubexpression()));

                if (t_expected.accepts(t_provided)) {
                    setEqual(t_expected, t_provided, e);
                    setEqual(t_provided, t_expected, e);
                } else {
                    try {
                        System.out.println(new CompilationError(e.getSpan(), "type mismatch",
                                t_expected.format() + " <- " + t_provided.format()).format());
                    } catch (IOException ex) {
                        ;
                    }
                }
            }
            return e;
        } else {
            return e;
        }
    }

    void setEqual(ALambdaTerm expected, ALambdaTerm provided, ASTElement e) {
        Logger.trace(expected.format() + " <-> " + provided.format());

        if (expected instanceof AVariable && !(provided instanceof AVariable)) {
            Optional<ASTElement> res = e.resolveName(((AVariable) expected).getName());
            if (res.isPresent()) {
                NewType t = (NewType) res.get();
                t.setResolution(provided);
            }
        } else if (expected instanceof AStructureReference && provided instanceof AStructureReference) {
            AStructureReference s_expected = (AStructureReference) expected;
            AStructureReference s_provided = (AStructureReference) provided;
            if (s_expected.getSource().getSource() instanceof Interface) {
                return;
            }

            for (int i = 0; i < s_expected.getParameters().size(); i++) {
                setEqual(s_expected.getParameters().get(i), s_provided.getParameters().get(i), e);
            }
        }
    }
}
