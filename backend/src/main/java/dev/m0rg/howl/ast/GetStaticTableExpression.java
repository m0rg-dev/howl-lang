package dev.m0rg.howl.ast;

public class GetStaticTableExpression extends Expression {
    Expression source;

    public GetStaticTableExpression(Span span) {
        super(span);
    }

    @Override
    public ASTElement detach() {
        GetStaticTableExpression rc = new GetStaticTableExpression(span);
        rc.setSource((Expression) source.detach());
        return rc;
    }

    @Override
    public String format() {
        return "$(" + this.source.format() + ")";
    }

    public void setSource(Expression source) {
        this.source = (Expression) source.setParent(this);
    }

    public void transform(ASTTransformer t) {
        source.transform(t);
        this.setSource(t.transform(source));
    }

    @Override
    public TypeElement getType() {
        TypeElement source_type = source.getResolvedType();
        if (source_type instanceof ClassType) {
            Class source = ((ClassType) source_type).getSource();
            return source.getStaticType();
        } else if (source_type instanceof InterfaceType) {
            Interface source = ((InterfaceType) source_type).getSource();
            return source.getStaticType();
        } else {
            return NamedType.build(span, "__error");
        }
    }
}
