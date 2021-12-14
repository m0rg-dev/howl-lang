package dev.m0rg.howl.transform;

import java.util.List;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.type.NewType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.ast.type.algebraic.ABaseType;
import dev.m0rg.howl.ast.type.algebraic.ACallResult;
import dev.m0rg.howl.ast.type.algebraic.AFreeType;
import dev.m0rg.howl.ast.type.algebraic.ASpecify;
import dev.m0rg.howl.ast.type.algebraic.AStructureType;
import dev.m0rg.howl.ast.type.algebraic.AVariable;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;
import dev.m0rg.howl.logger.Logger;

public class InferTypes implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof Expression) {
            AVariable.reset();
            Logger.trace("InferTypes: " + e.formatForLog());
            Logger.trace(" => " + AlgebraicType.deriveNew(e).formatForLog());
            return e;
        } else {
            return e;
        }
    }

    void setEqual(AlgebraicType expected, AlgebraicType provided) {
        if (expected instanceof AFreeType) {
            NewType t = ((AFreeType) expected).toElement();

            if (provided instanceof AFreeType
                    && ((AFreeType) expected).getPath().equals(((AFreeType) provided).getPath())) {
                return;
            }

            Logger.trace("set equal: " + expected.formatForLog() + " <- " + provided.formatForLog());
            if (t.getResolution().isPresent()) {
                Logger.trace("overwriting NewType definition " + t.getResolution().get().format() + " with "
                        + provided.toElement().format());
            }

            t.setResolution((TypeElement) provided.toElement().detach());
        }
    }

    void backpropagate(ABaseType expected, NewType provided) {
        Logger.trace("backpropagate: " + expected.formatForLog() + " -> " +
                provided.formatForLog());
        TypeElement as_element = (TypeElement) expected.toElement();
        if (provided.getResolution().isPresent() &&
                !provided.getResolution().get().accepts(as_element)) {
            throw new RuntimeException("overwriting " + provided.formatForLog() + " with incompatible type");
        }
        provided.setResolution((TypeElement) expected.toElement().detach());
    }

    void findRelationships(AlgebraicType expected, AlgebraicType provided) {
        Logger.trace(expected.getClass().getName() + " <- " + provided.getClass().getName());
        if (expected instanceof AFreeType) {
            setEqual(expected, provided);
        } else if (provided instanceof AFreeType && expected instanceof ABaseType) {
            backpropagate((ABaseType) expected, ((AFreeType) provided).toElement().getRealSource());
        } else if (expected instanceof AStructureType && provided instanceof AStructureType) {
            AStructureType e_structure = (AStructureType) expected;
            AStructureType p_structure = (AStructureType) provided;
            List<AlgebraicType> e_params = e_structure.getParameters();
            for (int i = 0; i < e_params.size() && i < p_structure.getParameters().size(); i++) {
                AlgebraicType e_param = e_params.get(i);
                AlgebraicType p_param = p_structure.getParameters().get(i);

                if (e_param instanceof AFreeType && p_param instanceof AFreeType
                        && ((AFreeType) e_param).getPath().equals(((AFreeType) p_param).getPath())) {
                    continue;
                }

                setEqual(e_param, p_param);
            }
        } else if (expected instanceof ASpecify && provided instanceof ASpecify) {
            ASpecify e_specify = (ASpecify) expected;
            ASpecify p_specify = (ASpecify) provided;

            findRelationships(e_specify.getSource(), p_specify.getSource());

            // List<AlgebraicType> e_params = e_specify.getParameters();
            // for (int i = 0; i < e_params.size(); i++) {
            // findRelationships(e_params.get(i), p_specify.getParameters().get(i));
            // }
        } else if (provided instanceof ACallResult) {
            findRelationships(expected, ((ACallResult) provided).evaluate());
        }
    }
}
