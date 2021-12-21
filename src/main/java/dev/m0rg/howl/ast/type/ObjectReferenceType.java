package dev.m0rg.howl.ast.type;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Field;
import dev.m0rg.howl.ast.ObjectCommon;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.type.iterative.FreeVariable;
import dev.m0rg.howl.ast.type.iterative.TypeObject;

public abstract class ObjectReferenceType extends TypeElement implements StructureType {
    String source_path;

    public ObjectReferenceType(Span span, String source_path) {
        super(span);
        this.source_path = source_path;
    }

    public void transform(ASTTransformer t) {
        ;
    }

    public String mangle() {
        return source_path.length() + source_path.replace(".", "_");
    }

    public ObjectCommon getSource() {
        Optional<ASTElement> target = this.resolveName(source_path);
        if (target.isPresent()) {
            return (ObjectCommon) target.get();
        } else {
            throw new RuntimeException("ObjectType of unresolvable " + source_path + "?");
        }
    }

    public Optional<Field> getField(String name) {
        return getSource().getField(name);
    }

    public List<String> getFieldNames() {
        return getSource().getFieldNames();
    }

    // TODO
    @Override
    public FreeVariable deriveType(Map<Expression, TypeObject> environment) {
        return ((NamedType) new NamedType(span, source_path).setParent(this.getParent())).deriveType(environment);
    }

    public FreeVariable deriveType(Map<Expression, TypeObject> environment, ASTElement real_parent) {
        return ((NamedType) new NamedType(span, source_path).setParent(real_parent)).deriveType(environment);
    }
}
