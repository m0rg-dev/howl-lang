package dev.m0rg.howl.ast;

public class FunctionCallExpression extends CallExpressionBase {
    Expression source;
    boolean resolved;

    public FunctionCallExpression(Span span) {
        super(span);
    }

    @Override
    public ASTElement detach() {
        FunctionCallExpression rc = new FunctionCallExpression(span);
        rc.setSource((Expression) source.detach());
        this.copyArguments(rc);
        rc.resolved = resolved;
        return rc;
    }

    @Override
    public String format() {
        return this.source.format() + this.getArgString();
    }

    public Expression getSource() {
        return source;
    }

    public void setSource(Expression source) {
        this.source = (Expression) source.setParent(this);
    }

    public void transform(ASTTransformer t) {
        source.transform(t);
        this.setSource(t.transform(source));
        this.transformArguments(t);
    }

    @Override
    public TypeElement getType() {
        TypeElement source_type = source.getResolvedType();
        if (source_type instanceof FunctionType) {
            FunctionType ft = (FunctionType) source_type;
            if (ft.isValid()) {
                return ft.getReturnType();
            }
        }
        return super.getType();
    }

    public boolean isResolved() {
        return resolved;
    }

    public void resolve() {
        resolved = true;
    }
}
