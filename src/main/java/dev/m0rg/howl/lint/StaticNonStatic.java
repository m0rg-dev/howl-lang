package dev.m0rg.howl.lint;

import java.util.List;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Field;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.ObjectCommon;
import dev.m0rg.howl.ast.expression.FieldReferenceExpression;
import dev.m0rg.howl.ast.expression.NameExpression;
import dev.m0rg.howl.ast.expression.SpecifiedTypeExpression;
import dev.m0rg.howl.ast.type.SpecifiedType;
import dev.m0rg.howl.ast.type.algebraic.AErrorType;
import dev.m0rg.howl.ast.type.algebraic.AIntersectionType;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.logger.Logger;

public class StaticNonStatic extends LintPass {
    public void check(ASTElement e) {
        if (e instanceof FieldReferenceExpression) {
            FieldReferenceExpression as_ref = (FieldReferenceExpression) e;
            ALambdaTerm type = ALambdaTerm
                    .evaluateFrom(as_ref.getSource());
            if (type instanceof AErrorType || type instanceof AIntersectionType)
                return;
            AStructureReference r = (AStructureReference) type;
            boolean field_is_static;
            boolean reference_is_static = (as_ref.getSource() instanceof NameExpression
                    && as_ref.resolveName(((NameExpression) as_ref.getSource()).getName()).map(x -> {
                        return (x instanceof ObjectCommon || x instanceof SpecifiedType);
                    }).orElse(false)) || as_ref.getSource() instanceof SpecifiedTypeExpression;
            if (r.getSource().getSource().getField(as_ref.getName()).isPresent()) {
                Field f = r.getSource().getSource().getField(as_ref.getName()).get();
                field_is_static = f.isStatic();
            } else if (r.getSource().getSource().getOverloadCandidates(as_ref.getName()).size() > 0) {
                List<Function> c = r.getSource().getSource().getOverloadCandidates(as_ref.getName());
                field_is_static = c.get(0).isStatic();
                c.remove(0);
                for (Function f : r.getSource().getSource().getOverloadCandidates(as_ref.getName())) {
                    if (f.isStatic() != field_is_static) {
                        f.getSpan().addError(
                                "method was previously defined as " + ((field_is_static) ? "" : "not ") + "static");
                        return;
                    }
                }
            } else {
                e.getSpan().addError("unknown field");
                throw new RuntimeException();
            }

            if (field_is_static != reference_is_static) {
                if (field_is_static) {
                    e.getSpan().addError("non-static reference to static field");
                } else {
                    e.getSpan().addError("static reference to non-static field");
                }
            }
        }
    }
}
