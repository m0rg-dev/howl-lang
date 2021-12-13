package dev.m0rg.howl.ast;

import dev.m0rg.howl.ast.type.HasOwnType;
import dev.m0rg.howl.ast.type.TypeElement;

public class Field extends ASTElement implements NamedElement, HasOwnType {
    String name;
    TypeElement fieldtype;
    boolean is_static;

    public Field(Span span, String name, boolean is_static) {
        super(span);
        this.name = name;
        this.is_static = is_static;
    }

    public Field(Span span, String name) {
        super(span);
        this.name = name;
        this.is_static = false;
    }

    @Override
    public ASTElement detach() {
        Field rc = new Field(span, name, is_static);
        rc.setType((TypeElement) fieldtype.detach());
        return rc;
    }

    @Override
    public String format() {
        return (this.is_static ? "static " : "") + fieldtype.format() + " " + name;
    }

    public void setType(TypeElement type) {
        this.fieldtype = (TypeElement) type.setParent(this);
    }

    public String getName() {
        return this.name;
    }

    public void transform(ASTTransformer t) {
        fieldtype.transform(t);
        setType(t.transform(fieldtype));
    }

    @Override
    public TypeElement getOwnType() {
        return fieldtype;
    }

    public boolean isStatic() {
        return is_static;
    }
}
