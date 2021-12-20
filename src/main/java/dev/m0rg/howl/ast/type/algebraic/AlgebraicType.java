package dev.m0rg.howl.ast.type.algebraic;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
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
import dev.m0rg.howl.ast.expression.LLVMInternalExpression;
import dev.m0rg.howl.ast.expression.MacroCallExpression;
import dev.m0rg.howl.ast.expression.NameExpression;
import dev.m0rg.howl.ast.expression.NumberExpression;
import dev.m0rg.howl.ast.expression.NumericCastExpression;
import dev.m0rg.howl.ast.expression.SpecifiedTypeExpression;
import dev.m0rg.howl.ast.expression.StringLiteral;
import dev.m0rg.howl.ast.expression.SuperCastExpression;
import dev.m0rg.howl.ast.statement.LocalDefinitionStatement;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.NewType;
import dev.m0rg.howl.ast.type.ObjectReferenceType;
import dev.m0rg.howl.ast.type.RawPointerType;
import dev.m0rg.howl.ast.type.SpecifiedType;
import dev.m0rg.howl.ast.type.TypeElement;

public abstract class AlgebraicType {

    static Map<ASTElement, ALambdaTerm> derive_cache = new HashMap<>();

    public static ALambdaTerm derive(ASTElement source) {
        // if (derive_cache.containsKey(source)) {
        // return derive_cache.get(source);
        // }
        ALambdaTerm rc = derive_inner(source);
        derive_cache.put(source, rc);
        return rc;
    }

    static ALambdaTerm derive_inner(ASTElement source) {
        if (source instanceof NameExpression) {
            // well, a name could be anything...
            Optional<ASTElement> res = source.resolveName(((NameExpression) source).getName());
            if (res.isPresent()) {
                return AlgebraicType.derive_inner(res.get());
            } else {
                return new AErrorType(source.getSpan(), "unresolved name");
            }
        } else if (source instanceof NamedType) {
            // this name could be a base type!
            NamedType as_named = (NamedType) source;
            if (as_named.isBase()) {
                return new ABaseType(as_named.getName());
            } else {
                Optional<ASTElement> res = as_named.resolveName(as_named.getName());
                if (res.isPresent()) {
                    return AlgebraicType.derive_inner(res.get());
                } else {
                    throw new IllegalArgumentException("derive unresolvable " + source.format());
                }
            }
        } else if (source instanceof NewType) {
            NewType as_newtype = (NewType) source;
            return new ANewtype(as_newtype);
        } else if (source instanceof ObjectReferenceType) {
            // we'll need to evaluate these lazily to avoid loops
            ObjectReferenceType as_ref = (ObjectReferenceType) source;
            int i;
            List<ALambdaTerm> params = new ArrayList<>();
            for (i = 0; i < as_ref.getSource().getGenericNames().size(); i++) {
                params.add(new AVariable());
            }
            return new AStructureReference(as_ref, new ATuple(params));
        } else if (source instanceof FieldReferenceExpression) {
            FieldReferenceExpression as_field_reference = (FieldReferenceExpression) source;
            ALambdaTerm field_source = derive_inner(as_field_reference.getSource());
            AVariable v = new AVariable();
            ALambda field_operation = v.lambda(new AFieldReferenceType(v, as_field_reference.getName()));
            return new AApplication(field_operation, field_source);
        } else if (source instanceof ConstructorCallExpression) {
            ConstructorCallExpression as_constructor_call = (ConstructorCallExpression) source;
            return as_constructor_call.getType();
        } else if (source instanceof SpecifiedType) {
            SpecifiedType as_specified = (SpecifiedType) source;

            ALambdaTerm rc = derive_inner(as_specified.getBase());
            List<TypeElement> parameters = new ArrayList<>(as_specified.getParameters());
            List<ALambdaTerm> reps = new ArrayList<>();
            for (TypeElement t : parameters) {
                reps.add(derive_inner(t));
            }
            rc = new ASpecify(rc, new ATuple(reps));

            return rc;
        } else if (source instanceof Argument) {
            return AlgebraicType.derive_inner(((Argument) source).getOwnType());
        } else if (source instanceof ObjectCommon) {
            return AlgebraicType.derive_inner(((ObjectCommon) source).getOwnType());
        } else if (source instanceof NumberExpression) {
            return new ABaseType("__numeric");
        } else if (source instanceof BooleanConstantExpression || source instanceof BooleanInversionExpression) {
            return new ABaseType("bool");
        } else if (source instanceof LocalDefinitionStatement) {
            LocalDefinitionStatement as_def = (LocalDefinitionStatement) source;
            return AlgebraicType.derive_inner(as_def.getOwnType());
        } else if (source instanceof Overload) {
            Overload as_overload = (Overload) source;
            return new AOverloadType(as_overload);
        } else if (source instanceof FunctionCallExpression) {
            FunctionCallExpression as_call = (FunctionCallExpression) source;
            return new ACallResult(AlgebraicType.derive_inner(as_call.getSource()),
                    as_call.getArguments().stream().map(x -> AlgebraicType.derive_inner(x)).toList());
        } else if (source instanceof RawPointerType) {
            return new ARawPointer(AlgebraicType.derive_inner(((RawPointerType) source).getInner()));
        } else if (source instanceof IndexExpression) {
            return new AIndexResult(AlgebraicType.derive_inner(((IndexExpression) source).getSource()));
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

            ALambdaTerm rc = derive_inner(as_specified.getSource());
            List<TypeElement> parameters = new ArrayList<>(as_specified.getParameters());
            List<ALambdaTerm> reps = new ArrayList<>();
            for (TypeElement t : parameters) {
                reps.add(derive_inner(t));
            }
            rc = new ASpecify(rc, new ATuple(reps));

            return rc;
        } else if (source instanceof ClassCastExpression) {
            return ((ClassCastExpression) source).getTarget();
        } else if (source instanceof CastToInterfaceExpression) {
            return ((CastToInterfaceExpression) source).getTarget();
        } else if (source instanceof NumericCastExpression) {
            return ((NumericCastExpression) source).getTarget();
        } else if (source instanceof LLVMInternalExpression) {
            return ((LLVMInternalExpression) source).getType();
        } else if (source instanceof SuperCastExpression) {
            return derive_inner(source.nearestObject().get().getExtends().get());
        }
        throw new RuntimeException(source.getClass().getName() + " " + source.getPath());
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
