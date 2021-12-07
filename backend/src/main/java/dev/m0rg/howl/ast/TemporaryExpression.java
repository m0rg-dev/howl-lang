package dev.m0rg.howl.ast;

import java.util.HashMap;
import java.util.Map;

public class TemporaryExpression extends Expression {
    static int counter = 0;

    Expression source;
    int index;

    public TemporaryExpression(Span span) {
        super(span);
        index = counter++;
    }

    TemporaryExpression(TemporaryExpression other) {
        super(other.getSpan());
        index = other.index;
    }

    @Override
    public ASTElement detach() {
        TemporaryExpression rc = new TemporaryExpression(this);
        rc.setSource((Expression) source.detach());
        return rc;
    }

    @Override
    public String format() {
        return "%" + index + " /* = " + source.format() + " */";
    }

    @Override
    public void transform(ASTTransformer t) {
        this.source.transform(t);
        this.setSource(t.transform(source));
    }

    public Expression getSource() {
        return source;
    }

    public void setSource(Expression source) {
        this.source = (Expression) source.setParent(this);
    }

    @Override
    public TypeElement getType() {
        return source.getType();
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        rc.put("source", new FieldHandle(() -> this.getSource(), (e) -> this.setSource(e),
                () -> new NamedType(this.span, "__any")));
        return rc;
    }
}
