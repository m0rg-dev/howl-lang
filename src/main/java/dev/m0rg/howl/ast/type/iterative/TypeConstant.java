package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;
import java.util.Optional;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Field;
import dev.m0rg.howl.ast.ObjectCommon;
import dev.m0rg.howl.ast.expression.Expression;

public class TypeConstant extends TypeObject implements FieldSource {
    String name;
    ASTElement source;

    public TypeConstant(String name, ASTElement source) {
        this.name = name;
        this.source = source;
    }

    @Override
    public String format() {
        return name;
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
        return this.equals(other, environment);
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
                                        environment.put(v, new FunctionType(x, environment));
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
