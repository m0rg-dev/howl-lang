package dev.m0rg.howl.ast;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

public class FieldReferenceExpression extends Expression {
    String name;
    Expression source;

    public FieldReferenceExpression(Span span, String name) {
        super(span);
        this.name = name;
    }

    @Override
    public ASTElement detach() {
        FieldReferenceExpression rc = new FieldReferenceExpression(span, name);
        rc.setSource((Expression) source.detach());
        return rc;
    }

    @Override
    public String format() {
        return this.source.format() + "." + this.name;
    }

    public Expression getSource() {
        return source;
    }

    public void setSource(Expression e) {
        this.source = (Expression) e.setParent(this);
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void transform(ASTTransformer t) {
        source.transform(t);
        setSource(t.transform(source));
    }

    @Override
    public TypeElement getType() {
        TypeElement source_type = source.getResolvedType();
        if (source_type instanceof NamedType && ((NamedType) source_type).getName().equals("__error")) {
            return source_type;
        } else if (source_type instanceof StructureType) {
            StructureType ct = (StructureType) source_type;
            Optional<Field> f = ct.getField(name);
            if (f.isPresent()) {
                return f.get().getOwnType();
            } else {
                span.addError("Attempt to access nonexistent field `" + name + "' on " + ct.format(),
                        "available fields are: " + String.join(", ", ct.getFieldNames()));
                return new NamedType(span, "__error");
            }
        } else {
            throw new RuntimeException(
                    "COMPILATION-ERROR attempt to take fields on non-structure " + source_type.format());
        }
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        rc.put("source", new FieldHandle(() -> this.getSource(), (e) -> this.setSource(e),
                () -> new NamedType(this.span, "__any")));
        return rc;
    }
}
