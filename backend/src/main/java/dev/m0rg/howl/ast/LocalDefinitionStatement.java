package dev.m0rg.howl.ast;

public class LocalDefinitionStatement extends Statement {
    TypeElement localtype;
    Expression initializer;
    String name;

    public LocalDefinitionStatement(Span span, String name) {
        super(span);
        this.name = name;
    }

    @Override
    public String format() {
        return "let " + this.localtype.format() + " " + this.name + " = " + this.initializer.format() + ";";
    }

    public void setInitializer(Expression initializer) {
        initializer.assertInsertable();
        this.initializer = (Expression) initializer.setParent(this);
    }

    public void setLocaltype(TypeElement localtype) {
        localtype.assertInsertable();
        this.localtype = (TypeElement) localtype.setParent(this);
    }
}
