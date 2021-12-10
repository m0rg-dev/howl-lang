package dev.m0rg.howl.ast.statement;

import java.util.Optional;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.NameHolder;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.HasOwnType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.llvm.LLVMFunction;

public class CatchStatement extends Statement implements NameHolder, HasOwnType {
    private CompoundStatement body;
    TypeElement exctype;
    String excname;

    public CatchStatement(Span span, String excname) {
        super(span);
        this.excname = excname;
    }

    @Override
    public ASTElement detach() {
        CatchStatement rc = new CatchStatement(span, excname);
        rc.setBody((CompoundStatement) this.getBody().detach());
        rc.setType((TypeElement) this.getType().detach());
        return rc;
    }

    @Override
    public String format() {
        return "catch " + this.getType().format() + " " + this.excname + " " + this.getBody().format();
    }

    public CompoundStatement getBody() {
        return body;
    }

    public void setBody(CompoundStatement body) {
        this.body = (CompoundStatement) body.setParent(this);
    }

    public TypeElement getType() {
        return exctype;
    }

    public TypeElement getOwnType() {
        return exctype;
    }

    public void setType(TypeElement type) {
        this.exctype = (TypeElement) type.setParent(this);
    }

    public Optional<ASTElement> getChild(String name) {
        if (excname.equals(name)) {
            return Optional.of(this);
        }
        return Optional.empty();
    }

    public void transform(ASTTransformer t) {
        getBody().transform(t);
        this.setBody(t.transform(getBody()));
        getType().transform(t);
        this.setType(t.transform(getType()));
    }

    @Override
    public void generate(LLVMFunction f) {
        throw new UnsupportedOperationException();
    }
}
