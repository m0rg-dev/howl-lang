package dev.m0rg.howl.ast.type.algebraic;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import dev.m0rg.howl.Compiler;
import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Module;
import dev.m0rg.howl.ast.expression.ArithmeticExpression;
import dev.m0rg.howl.ast.expression.BooleanConstantExpression;
import dev.m0rg.howl.ast.expression.BooleanInversionExpression;
import dev.m0rg.howl.ast.expression.ClassCastExpression;
import dev.m0rg.howl.ast.expression.ConstructorCallExpression;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.expression.FieldReferenceExpression;
import dev.m0rg.howl.ast.expression.FunctionCallExpression;
import dev.m0rg.howl.ast.expression.GetStaticTableExpression;
import dev.m0rg.howl.ast.expression.IndexExpression;
import dev.m0rg.howl.ast.expression.MacroCallExpression;
import dev.m0rg.howl.ast.expression.NameExpression;
import dev.m0rg.howl.ast.expression.NumberExpression;
import dev.m0rg.howl.ast.expression.SpecifiedTypeExpression;
import dev.m0rg.howl.ast.expression.StringLiteral;
import dev.m0rg.howl.ast.type.FunctionType;
import dev.m0rg.howl.ast.type.HasOwnType;
import dev.m0rg.howl.ast.type.LambdaType;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.NewType;
import dev.m0rg.howl.ast.type.ObjectReferenceType;
import dev.m0rg.howl.ast.type.RawPointerType;
import dev.m0rg.howl.ast.type.SpecifiedType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.logger.Logger;

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

    static Map<ASTElement, AlgebraicType> cache = new HashMap<>();

    public static void invalidateCache() {
        cache = new HashMap<ASTElement, AlgebraicType>();
    }

    public static AlgebraicType derive(ASTElement source) {
        return derive(source, new HashMap<>());
    }

    static AlgebraicType derive(ASTElement source, Map<String, AlgebraicType> typemap) {
        if (cache.containsKey(source)) {
            return cache.get(source);
        }
        AlgebraicType rc = _derive(source, typemap);
        cache.put(source, rc);
        return rc;
    }

    static AlgebraicType _derive(ASTElement source, Map<String, AlgebraicType> typemap) {
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
            return new AObjectType((ObjectReferenceType) source, typemap);
        } else if (source instanceof NewType) {
            return new AFreeType((NewType) source);
        } else if (source instanceof LambdaType) {
            return new AFunctionType((LambdaType) source, typemap);
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
        } else if (source instanceof IndexExpression) {
            AlgebraicType source_type = AlgebraicType.derive(((IndexExpression) source).getSource(), typemap);
            return new AIndexResult(source_type);
        } else if (source instanceof SpecifiedType) {
            SpecifiedType st = (SpecifiedType) source;

            AStructureType base = (AStructureType) AlgebraicType.derive(st.getBase(), typemap);
            List<AlgebraicType> parameters = new ArrayList<>();
            for (TypeElement e : st.getParameters()) {
                parameters.add(AlgebraicType.derive(e, typemap));
            }

            return new ASpecify(base, parameters);
        } else if (source instanceof GetStaticTableExpression || source instanceof ArithmeticExpression
                || source instanceof ClassCastExpression || source instanceof BooleanInversionExpression) {
            return new AStableType(((Expression) source).getType());
        } else if (source instanceof BooleanConstantExpression) {
            return new ABaseType("bool");
        } else if (source instanceof RawPointerType) {
            AlgebraicType source_type = AlgebraicType.derive(((RawPointerType) source).getInner());
            return new ARawPointer(source_type);
        } else if (source instanceof StringLiteral) {
            return new ARawPointer(new ABaseType("u8"));
        } else if (source instanceof SpecifiedTypeExpression) {
            return AlgebraicType.derive(((SpecifiedTypeExpression) source).getType());
        } else if (source instanceof MacroCallExpression) {
            return new AAnyType();
        } else if (source instanceof Module) {
            // this can happen in certain cases with unresolved names
            Logger.trace("creating error type: AlgebraicType of Module");
            return new ABaseType("__error");
        }
        throw new RuntimeException(source.format() + " " + source.getClass().getSimpleName());
    }

    public TypeElement toElement() {
        throw new UnsupportedOperationException(this.getClass().getName());
    }

    public abstract String format();

    /**
     * Formats only if --trace was passed; otherwise, returns empty string.
     */
    public String formatForLog() {
        if (Compiler.cmd.hasOption("trace")) {
            return format();
        } else {
            return "";
        }
    }
}
