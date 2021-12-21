package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;
import java.util.Optional;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Field;
import dev.m0rg.howl.ast.ObjectCommon;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.NumericType;

public class TypeConstant extends TypeObject implements FieldSource {
    String name;
    ASTElement source;

    public TypeConstant(String name, ASTElement source) {
        this.name = name;
        this.source = source;
    }

    @Override
    public String format() {
        return "#" + name;
    }

    @Override
    public boolean equals(TypeObject other, Map<Expression, TypeObject> environment) {
        if (other.dereferenced(environment) instanceof TypeConstant) {
            return ((TypeConstant) other.dereferenced(environment)).name.equals(name);
        }
        return false;
    }

    @Override
    public boolean accepts(TypeObject other, Map<Expression, TypeObject> environment) {
        if (this.equals(other, environment)) {
            return true;
        }

        if (other.dereferenced(environment) instanceof TypeConstant) {
            NamedType t = NamedType.build(null, ((TypeConstant) other.dereferenced(environment)).name);
            NamedType u = NamedType.build(null, name);
            if (t instanceof NumericType && u instanceof NumericType) {
                return true;
            }
        }

        return false;
    }

    @Override
    public boolean isSubstitutable(Map<Expression, TypeObject> environment) {
        return true;
    }

    @Override
    public TypeObject getField(String name, Map<Expression, TypeObject> environment) {
        Optional<ASTElement> source_element = source.resolveName(this.name);
        if (source_element.isPresent()) {
            if (source_element.get() instanceof ObjectCommon) {
                ObjectCommon o = (ObjectCommon) source_element.get();

                Optional<Field> f = o.getField(name);
                if (f.isPresent()) {
                    return new TypeAlias(f.get().getOwnType().deriveType(environment));
                }

                if (o.getOverloadCandidates(name).size() > 0) {
                    return new OverloadType(
                            o.getOverloadCandidates(name).stream()
                                    .map(x -> {
                                        FreeVariable v = new FreeVariable();
                                        FunctionType t = new FunctionType(x, environment);
                                        if (x.isStatic()) {
                                            t.self_type = this;
                                        }
                                        environment.put(v, t);
                                        return (TypeObject) new TypeAlias(v);
                                    })
                                    .toList());
                }

                return new ErrorType(source.getSpan(), "no such field");
            } else {
                return new ErrorType(source.getSpan(), "not an object");
            }
        } else {
            return new ErrorType(source.getSpan(), "unresolved name: " + this.name);
        }
    }
}
