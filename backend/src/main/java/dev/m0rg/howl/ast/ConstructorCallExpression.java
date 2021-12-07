package dev.m0rg.howl.ast;

import java.util.HashMap;
import java.util.Map;

public class ConstructorCallExpression extends CallExpressionBase {
    TypeElement source;

    public ConstructorCallExpression(Span span) {
        super(span);
    }

    @Override
    public ASTElement detach() {
        ConstructorCallExpression rc = new ConstructorCallExpression(span);
        rc.setSource((TypeElement) source.detach());
        this.copyArguments(rc);
        return rc;
    }

    @Override
    public String format() {
        return "new " + this.source.format() + this.getArgString();
    }

    public void setSource(TypeElement source) {
        this.source = (TypeElement) source.setParent(this);
    }

    public void transform(ASTTransformer t) {
        source.transform(t);
        this.setSource(t.transform(source));
        this.transformArguments(t);
    }

    @Override
    public TypeElement getType() {
        return source;
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        addFields(rc);
        return rc;
    }

    @Override
    protected TypeElement getTypeForArgument(int index) {
        // TODO
        return new NamedType(this.span, "__any");
    }
}
