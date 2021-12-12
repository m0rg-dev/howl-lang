package dev.m0rg.howl.transform;

import java.util.List;
import java.util.Map.Entry;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.HasUpstreamFields;
import dev.m0rg.howl.ast.type.NewType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.ast.type.algebraic.ABaseType;
import dev.m0rg.howl.ast.type.algebraic.ACallResult;
import dev.m0rg.howl.ast.type.algebraic.AFreeType;
import dev.m0rg.howl.ast.type.algebraic.ASpecify;
import dev.m0rg.howl.ast.type.algebraic.AStructureType;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;
import dev.m0rg.howl.logger.Logger;

public class InferTypes implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof HasUpstreamFields) {
            Logger.trace("InferTypes: " + e.format());
            for (Entry<String, FieldHandle> ent : ((HasUpstreamFields) e).getUpstreamFields().entrySet()) {
                AlgebraicType expected = ent.getValue().getExpectedType();
                AlgebraicType provided = AlgebraicType.derive(ent.getValue().getSubexpression());
                Logger.trace(
                        " " + ent.getKey() + " " + expected.format() + " <- "
                                + provided.format());
                findRelationships(expected, provided);
            }
            return e;
        } else {
            return e;
        }
    }

    void findRelationships(AlgebraicType expected, AlgebraicType provided) {
        if (expected instanceof AFreeType) {
            NewType t = ((AFreeType) expected).toElement();
            Logger.trace("set equal: " + expected.format() + " <- " + provided.format());
            if (t.getResolution().isPresent()) {
                Logger.warn("overwriting NewType definition " + t.getResolution().get().format());
            }
            t.setResolution((TypeElement) provided.toElement().detach());
        } else if (provided instanceof AFreeType && expected instanceof ABaseType) {
            NewType t = ((AFreeType) provided).toElement();
            Logger.trace("backpropagate: " + expected.format() + " -> " + provided.format());
            TypeElement as_element = (TypeElement) expected.toElement();
            if (t.getResolution().isPresent() && !t.getResolution().get().accepts(as_element)) {
                throw new RuntimeException("overwriting " + t.format() + " with incompatible type");
            }
            t.setResolution((TypeElement) expected.toElement().detach());
        } else if (expected instanceof ASpecify && provided instanceof ASpecify) {
            ASpecify e_specify = (ASpecify) expected;
            ASpecify p_specify = (ASpecify) provided;

            findRelationships(e_specify.getSource(), p_specify.getSource());

            List<AlgebraicType> e_params = e_specify.getParameters();
            for (int i = 0; i < e_params.size(); i++) {
                findRelationships(e_params.get(i), p_specify.getParameters().get(i));
            }
        } else if (provided instanceof ACallResult) {
            Logger.trace("12313 " + provided.half_evaluate().format());
            findRelationships(expected, ((ACallResult) provided).half_evaluate());
        }
    }
}
