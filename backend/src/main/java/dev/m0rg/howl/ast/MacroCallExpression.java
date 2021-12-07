package dev.m0rg.howl.ast;

import java.util.HashMap;
import java.util.Map;

public class MacroCallExpression extends CallExpressionBase {
    String name;

    public MacroCallExpression(Span span, String name) {
        super(span);
        this.name = name;
    }

    @Override
    public ASTElement detach() {
        MacroCallExpression rc = new MacroCallExpression(span, name);
        copyArguments(rc);
        return rc;
    }

    @Override
    public String format() {
        return "!" + this.name + this.getArgString();
    }

    public void transform(ASTTransformer t) {
        this.transformArguments(t);
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        addFields(rc);
        return rc;
    }

    @Override
    protected TypeElement getTypeForArgument(int index) {
        return new NamedType(this.span, "__any");
    }
}
