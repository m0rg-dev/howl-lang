package dev.m0rg.howl.ast.type.algebraic;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import dev.m0rg.howl.Compiler;
import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Argument;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.ObjectCommon;
import dev.m0rg.howl.ast.Overload;
import dev.m0rg.howl.ast.expression.ArithmeticExpression;
import dev.m0rg.howl.ast.expression.BooleanConstantExpression;
import dev.m0rg.howl.ast.expression.BooleanInversionExpression;
import dev.m0rg.howl.ast.expression.CastToInterfaceExpression;
import dev.m0rg.howl.ast.expression.ClassCastExpression;
import dev.m0rg.howl.ast.expression.ConstructorCallExpression;
import dev.m0rg.howl.ast.expression.FieldReferenceExpression;
import dev.m0rg.howl.ast.expression.FunctionCallExpression;
import dev.m0rg.howl.ast.expression.IndexExpression;
import dev.m0rg.howl.ast.expression.MacroCallExpression;
import dev.m0rg.howl.ast.expression.NameExpression;
import dev.m0rg.howl.ast.expression.NumberExpression;
import dev.m0rg.howl.ast.expression.NumericCastExpression;
import dev.m0rg.howl.ast.expression.SpecifiedTypeExpression;
import dev.m0rg.howl.ast.expression.StringLiteral;
import dev.m0rg.howl.ast.statement.LocalDefinitionStatement;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.NewType;
import dev.m0rg.howl.ast.type.ObjectReferenceType;
import dev.m0rg.howl.ast.type.RawPointerType;
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
                return new ABaseType(as_named.getName());
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
            if (as_newtype.getIndex() >= 0) {
                return new ANewtype(as_newtype, "T" + as_newtype.getIndex());
            } else {
                return new ANewtype(as_newtype);
            }
        } else if (source instanceof ObjectReferenceType) {
            // we'll need to evaluate these lazily to avoid loops
            ObjectReferenceType as_ref = (ObjectReferenceType) source;
            return new AStructureReference(as_ref);
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
            // TODO handle source<T, U> etc
            SpecifiedType as_specified = (SpecifiedType) source;
            ALambdaTerm spec_source = deriveNew(as_specified.getBase());
            AVariable v = new AVariable("T0");
            ALambda spec_operation = v.lambda(spec_source);
            return new AApplication(spec_operation, deriveNew(as_specified.getParameters().get(0)));
        } else if (source instanceof Argument) {
            return AlgebraicType.deriveNew(((Argument) source).getOwnType());
        } else if (source instanceof ObjectCommon) {
            return AlgebraicType.deriveNew(((ObjectCommon) source).getOwnType());
        } else if (source instanceof NumberExpression) {
            return new ABaseType("__numeric");
        } else if (source instanceof BooleanConstantExpression || source instanceof BooleanInversionExpression) {
            return new ABaseType("bool");
        } else if (source instanceof LocalDefinitionStatement) {
            LocalDefinitionStatement as_def = (LocalDefinitionStatement) source;
            return AlgebraicType.deriveNew(as_def.getOwnType());
        } else if (source instanceof Overload) {
            Overload as_overload = (Overload) source;
            return new AOverloadType(as_overload);
        } else if (source instanceof FunctionCallExpression) {
            FunctionCallExpression as_call = (FunctionCallExpression) source;
            return new ACallResult(AlgebraicType.deriveNew(as_call.getSource()),
                    as_call.getArguments().stream().map(x -> AlgebraicType.deriveNew(x)).toList());
        } else if (source instanceof RawPointerType) {
            return new ARawPointer(AlgebraicType.deriveNew(((RawPointerType) source).getInner()));
        } else if (source instanceof IndexExpression) {
            return new AIndexResult(AlgebraicType.deriveNew(((IndexExpression) source).getSource()));
        } else if (source instanceof MacroCallExpression) {
            return new AAnyType();
        } else if (source instanceof Function) {
            return new AFunctionReference((Function) source);
        } else if (source instanceof StringLiteral) {
            return new ARawPointer(new ABaseType("u8"));
        } else if (source instanceof ArithmeticExpression) {
            return ((ArithmeticExpression) source).getType();
        } else if (source instanceof SpecifiedTypeExpression) {
            SpecifiedTypeExpression as_specified = (SpecifiedTypeExpression) source;
            ALambdaTerm spec_source = deriveNew(as_specified.getSource());
            AVariable v = new AVariable("T0");
            ALambda spec_operation = v.lambda(spec_source);
            return new AApplication(spec_operation, deriveNew(as_specified.getParameters().get(0)));
        } else if (source instanceof ClassCastExpression) {
            return deriveNew(((ClassCastExpression) source).getTarget());
        } else if (source instanceof CastToInterfaceExpression) {
            return deriveNew(((CastToInterfaceExpression) source).getTarget());
        } else if (source instanceof NumericCastExpression) {
            return ((NumericCastExpression) source).getTarget();
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
