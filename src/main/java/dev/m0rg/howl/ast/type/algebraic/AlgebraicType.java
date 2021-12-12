package dev.m0rg.howl.ast.type.algebraic;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.expression.ConstructorCallExpression;
import dev.m0rg.howl.ast.expression.FieldReferenceExpression;
import dev.m0rg.howl.ast.expression.FunctionCallExpression;
import dev.m0rg.howl.ast.expression.NameExpression;
import dev.m0rg.howl.ast.expression.NumberExpression;
import dev.m0rg.howl.ast.type.FunctionType;
import dev.m0rg.howl.ast.type.HasOwnType;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.NewType;
import dev.m0rg.howl.ast.type.ObjectReferenceType;
import dev.m0rg.howl.ast.type.SpecifiedType;
import dev.m0rg.howl.ast.type.TypeElement;

public abstract class AlgebraicType {
    public static AlgebraicType todo() {
        throw new UnsupportedOperationException();
    }

    public AlgebraicType evaluate() {
        return this.evaluate(new HashMap<>());
    }

    public AlgebraicType evaluate(Map<String, AlgebraicType> typemap) {
        throw new UnsupportedOperationException(this.getClass().getName());
    }

    public static AlgebraicType derive(ASTElement source) {
        return derive(source, new HashMap<>());
    }

    public static AlgebraicType derive(ASTElement source, Map<String, AlgebraicType> typemap) {
        if (source instanceof NameExpression) {
            Optional<ASTElement> res = source.resolveName(((NameExpression) source).getName());
            if (res.isPresent()) {
                return AlgebraicType.derive(res.get(), typemap);
            } else {
                throw new IllegalArgumentException("derive unresolvable " + source.format());
            }
        } else if (source instanceof HasOwnType) {
            return AlgebraicType.derive(((HasOwnType) source).getOwnType(), typemap);
        } else if (source instanceof NamedType) {
            String name = ((NamedType) source).getName();
            Optional<ASTElement> res = source.resolveName(name);

            if (res.isPresent()) {
                String path = res.get().getPath();
                if (typemap.containsKey(path)) {
                    return typemap.get(path);
                }
                AlgebraicType rc = AlgebraicType.derive(res.get(), typemap);
                return rc;
            } else if (((NamedType) source).isBase()) {
                return new ABaseType(name);
            } else {
                throw new IllegalArgumentException("derive unresolvable " + source.format());
            }
        } else if (source instanceof ObjectReferenceType) {
            return new AStructureType((ObjectReferenceType) source, typemap);
        } else if (source instanceof NewType) {
            return new AFreeType((NewType) source);
        } else if (source instanceof FunctionType) {
            return new AFunctionType(((FunctionType) source).getSource(), typemap);
        } else if (source instanceof NumberExpression) {
            return AlgebraicType.derive(((NumberExpression) source).getType(), typemap);
        } else if (source instanceof FieldReferenceExpression) {
            FieldReferenceExpression fre = (FieldReferenceExpression) source;
            AlgebraicType source_type = AlgebraicType.derive(fre.getSource(), typemap);
            return new AFieldReferenceType(source_type, fre.getName());
        } else if (source instanceof ConstructorCallExpression) {
            ConstructorCallExpression cce = (ConstructorCallExpression) source;
            return AlgebraicType.derive(cce.getType(), typemap);
        } else if (source instanceof FunctionCallExpression) {
            AlgebraicType source_type = AlgebraicType.derive(((FunctionCallExpression) source).getSource(), typemap);
            return new ACallResult(source_type);
        } else if (source instanceof SpecifiedType) {
            SpecifiedType st = (SpecifiedType) source;

            AStructureType base = (AStructureType) AlgebraicType.derive(st.getBase(), typemap);
            List<AlgebraicType> parameters = new ArrayList<>();
            for (TypeElement e : st.getParameters()) {
                parameters.add(AlgebraicType.derive(e, typemap));
            }

            return new ASpecify(base, parameters);
        }
        throw new RuntimeException(source.format() + " " + source.getClass().getSimpleName());
    }

    public TypeElement toElement() {
        throw new UnsupportedOperationException(this.getClass().getName());
    }

    /**
     * Evaluate without resolving any new fields.
     */
    public AlgebraicType half_evaluate() {
        throw new UnsupportedOperationException(this.getClass().getName());
    }

    public abstract String format();
}
