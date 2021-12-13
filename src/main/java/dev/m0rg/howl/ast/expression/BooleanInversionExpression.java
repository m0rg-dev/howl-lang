package dev.m0rg.howl.ast.expression;

import java.util.HashMap;
import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.ast.type.algebraic.ABaseType;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMValue;

public class BooleanInversionExpression extends Expression {
    Expression source;

    public BooleanInversionExpression(Span span) {
        super(span);
    }

    public void setSource(Expression source) {
        this.source = (Expression) source.setParent(this);
    }

    public Expression getSource() {
        return source;
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        rc.put("source", new FieldHandle(() -> this.getSource(), (e) -> this.setSource(e),
                () -> new ABaseType("bool")));
        return rc;
    }

    @Override
    public TypeElement getType() {
        return NamedType.build(span, "bool");
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        return builder.buildNot(source.generate(builder), "");
    }

    @Override
    public ASTElement detach() {
        BooleanInversionExpression rc = new BooleanInversionExpression(span);
        rc.setSource((Expression) source.detach());
        return rc;
    }

    @Override
    public String format() {
        return "!" + source.format();
    }

    @Override
    public void transform(ASTTransformer t) {
        source.transform(t);
        setSource(t.transform(source));
    }

}
