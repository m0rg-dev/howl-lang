package dev.m0rg.howl.ast.type.algebraic;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.bytedeco.javacpp.annotation.Const;

import dev.m0rg.howl.Compiler;
import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Argument;
import dev.m0rg.howl.ast.Function;
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

    public static ALambdaTerm deriveNew(ASTElement source) {
        if (source instanceof NameExpression) {
            // well, a name could be anything...
            Optional<ASTElement> res = source.resolveName(((NameExpression) source).getName());
            if (res.isPresent()) {
                return AlgebraicType.deriveNew(res.get());
            } else {
                throw new IllegalArgumentException("derive unresolvable " + source.format());
            }
        } else if (source instanceof NamedType) {
            // this name could be a base type!
            NamedType as_named = (NamedType) source;
            if (as_named.isBase()) {
                // and this is one of our base cases, because base types can't
                // be parameterized - i.e. (\x.1).
                AVariable v = new AVariable();
                return v.lambda(new ABaseType(as_named.getName()));
            } else {
                Optional<ASTElement> res = as_named.resolveName(as_named.getName());
                if (res.isPresent()) {
                    return AlgebraicType.deriveNew(res.get());
                } else {
                    throw new IllegalArgumentException("derive unresolvable " + source.format());
                }
            }
        } else if (source instanceof NewType) {
            NewType as_newtype = (NewType) source;
            // this is our other base case, a variable by itself - i.e. (x)
            if (as_newtype.getIndex() >= 0) {
                return new AVariable("T" + as_newtype.getIndex());
            } else {
                return new AVariable(as_newtype.getPath());
            }
        } else if (source instanceof ObjectReferenceType) {
            // we'll need to evaluate these lazily to avoid loops
            ObjectReferenceType as_ref = (ObjectReferenceType) source;
            AVariable v = new AVariable();
            return v.lambda(new AStructureReference(as_ref.getSource().getPath()));
        } else if (source instanceof FieldReferenceExpression) {
            FieldReferenceExpression as_field_reference = (FieldReferenceExpression) source;
            ALambdaTerm field_source = deriveNew(as_field_reference.getSource());
            AVariable v = new AVariable();
            ALambda field_operation = v.lambda(new AFieldReferenceType(v, as_field_reference.getName()));
            return new AApplication(field_operation, field_source);
        } else if (source instanceof ConstructorCallExpression) {
            // Constructor calls return their own type - i.e. (\x.x).
            ConstructorCallExpression as_constructor_call = (ConstructorCallExpression) source;
            ALambdaTerm new_source = deriveNew(as_constructor_call.getType());
            AVariable v = new AVariable();
            ALambda new_operation = v.lambda(v);
            return new AApplication(new_operation, new_source);
        } else if (source instanceof SpecifiedType) {
            SpecifiedType as_specified = (SpecifiedType) source;
            ALambdaTerm spec_source = deriveNew(as_specified.getBase());
            AVariable v = new AVariable("T0");
            ALambda spec_operation = v.lambda(spec_source);
            return new AApplication(spec_operation, deriveNew(as_specified.getParameters().get(0)));
        } else if (source instanceof Argument) {
            return AlgebraicType.deriveNew(((Argument) source).getOwnType());
        } else if (source instanceof NumberExpression) {
            AVariable v = new AVariable();
            return v.lambda(new ABaseType("__numeric"));
        }

        throw new RuntimeException(source.getClass().getName());
    }

    @Deprecated
    public static AlgebraicType derive(ASTElement source) {
        return derive(source, new HashMap<>());
    }

    @Deprecated
    static AlgebraicType derive(ASTElement source, Map<String, AlgebraicType> typemap) {
        if (cache.containsKey(source)) {
            return cache.get(source);
        }
        AlgebraicType rc = _derive(source, typemap);
        cache.put(source, rc);
        return rc;
    }

    @Deprecated
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
            return new AObjectTypeOld((ObjectReferenceType) source, typemap);
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

            return new ASpecify(base, new HashMap<>());
        } else if (source instanceof GetStaticTableExpression || source instanceof ArithmeticExpression
                || source instanceof ClassCastExpression || source instanceof BooleanInversionExpression) {
            return new AStableTypeOld(((Expression) source).getType());
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
