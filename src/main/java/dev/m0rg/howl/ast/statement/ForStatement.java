package dev.m0rg.howl.ast.statement;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.llvm.LLVMFunction;

public class ForStatement extends Statement {
    String name;
    TypeElement localtype;
    Expression source;
    CompoundStatement body;

    public ForStatement(Span span, String name) {
        super(span);
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public TypeElement getLocaltype() {
        return localtype;
    }

    public void setLocaltype(TypeElement localtype) {
        this.localtype = (TypeElement) localtype.setParent(this);
    }

    public Expression getSource() {
        return source;
    }

    public void setSource(Expression source) {
        this.source = (Expression) source.setParent(this);
    }

    public CompoundStatement getBody() {
        return body;
    }

    public void setBody(CompoundStatement body) {
        this.body = (CompoundStatement) body.setParent(this);
    }

    @Override
    public void generate(LLVMFunction f) {
        throw new UnsupportedOperationException();
    }

    @Override
    public ASTElement detach() {
        ForStatement rc = new ForStatement(span, name);
        rc.setAnnotation(annotation);
        rc.setLocaltype((TypeElement) localtype.detach());
        rc.setSource((Expression) source.detach());
        rc.setBody((CompoundStatement) body.detach());
        return rc;
    }

    @Override
    public String format() {
        return "for " + localtype.format() + " " + name + " in " + source.format() + " " + body.format();
    }

    @Override
    public void transform(ASTTransformer t) {
        localtype.transform(t);
        setLocaltype(t.transform(localtype));

        source.transform(t);
        setSource(t.transform(source));

        body.transform(t);
        setBody((CompoundStatement) t.transform(body));
    }

}
