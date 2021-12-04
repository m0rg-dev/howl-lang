package dev.m0rg.howl.ast;

public class Field extends ASTElement implements NamedElement {
    String name;
    TypeElement fieldtype;

    public Field(Span span, String name) {
        super(span);
        this.name = name;
    }

    @Override
    public ASTElement detach() {
        Field rc = new Field(span, name);
        rc.setType((TypeElement) fieldtype.detach());
        return rc;
    }

    @Override
    public String format() {
        return fieldtype.format() + " " + name;
    }

    public void setType(TypeElement type) {
        this.fieldtype = (TypeElement) type.setParent(this);
    }

    public String getName() {
        return this.name;
    }

    public void transform(ASTTransformer t) {
        fieldtype.transform(t);
        fieldtype = t.transform(fieldtype);
    }
}
