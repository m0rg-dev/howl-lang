package dev.m0rg.howl.ast;

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

    public void setSource(Expression e) {
        this.source = (Expression) e.setParent(this);
    }

    public void transform(ASTTransformer t) {
        source.transform(t);
        source = t.transform(source);
    }

    @Override
    public TypeElement getType() {
        TypeElement source_type = source.getResolvedType();
        if (source_type instanceof NamedType && ((NamedType) source_type).getName().equals("__error")) {
            return source_type;
        } else if (source_type instanceof ClassType) {
            ClassType ct = (ClassType) source_type;
            Optional<Field> f = ct.getField(name);
            if (f.isPresent()) {
                return f.get().getOwnType();
            } else {
                span.addError("Attempt to access nonexistent field " + name + " on " + ct.format(),
                        "available fields are: " + String.join(", ", ct.getFieldNames()));
                return new NamedType(span, "__error");
            }
        } else {
            throw new RuntimeException("COMPILATION-ERROR attempt to take fields on non-class " + source_type.format());
        }
    }
}
