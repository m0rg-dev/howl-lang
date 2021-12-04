package dev.m0rg.howl.ast;

public class LocalDefinitionStatement extends Statement implements NamedElement {
    TypeElement localtype;
    Expression initializer;
    String name;

    public LocalDefinitionStatement(Span span, String name) {
        super(span);
        this.name = name;
    }

    @Override
    public ASTElement detach() {
        LocalDefinitionStatement rc = new LocalDefinitionStatement(span, name);
        rc.setInitializer((Expression) initializer.detach());
        rc.setLocaltype((TypeElement) localtype.detach());
        return rc;
    }

    @Override
    public String format() {
        return "let " + this.localtype.format() + " " + this.name + " = " + this.initializer.format() + ";";
    }

    public void setInitializer(Expression initializer) {
        this.initializer = (Expression) initializer.setParent(this);
    }

    public void setLocaltype(TypeElement localtype) {
        this.localtype = (TypeElement) localtype.setParent(this);
    }

    public String getName() {
        return this.name;
    }

    public void transform(ASTTransformer t) {
        localtype.transform(t);
        this.setLocaltype(t.transform(localtype));
        initializer.transform(t);
        this.setInitializer(t.transform(initializer));
    }
}
