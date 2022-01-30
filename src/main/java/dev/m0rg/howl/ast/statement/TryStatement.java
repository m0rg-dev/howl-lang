package dev.m0rg.howl.ast.statement;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.llvm.LLVMFunction;

public class TryStatement extends Statement {
    private CompoundStatement body;
    List<CatchStatement> alternatives;

    public static Set<TryStatement> all_try_statements = new HashSet<>();

    public TryStatement(Span span) {
        super(span);
        alternatives = new ArrayList<CatchStatement>();
    }

    public CompoundStatement getBody() {
        return body;
    }

    @Override
    public ASTElement setParent(ASTElement parent) {
        all_try_statements.add(this);
        return super.setParent(parent);
    }

    @Override
    public ASTElement detach() {
        TryStatement rc = new TryStatement(span);
        rc.setAnnotation(annotation);
        rc.setBody((CompoundStatement) this.getBody().detach());
        for (CatchStatement a : this.alternatives) {
            rc.insertAlternative((CatchStatement) a.detach());
        }
        return rc;
    }

    @Override
    public String format() {
        StringBuilder rc = new StringBuilder("try " + this.getBody().format());
        for (CatchStatement a : this.alternatives) {
            rc.append(" " + a.format());
        }
        return rc.toString();
    }

    public void setBody(CompoundStatement body) {
        this.body = (CompoundStatement) body.setParent(this);
    }

    public void insertAlternative(CatchStatement a) {
        this.alternatives.add((CatchStatement) a.setParent(this));
    }

    public List<CatchStatement> getAlternatives() {
        return Collections.unmodifiableList(alternatives);
    }

    public void transform(ASTTransformer t) {
        getBody().transform(t);
        this.setBody(t.transform(getBody()));
        for (int i = 0; i < alternatives.size(); i++) {
            alternatives.get(i).transform(t);
            alternatives.set(i, (CatchStatement) t.transform(alternatives.get(i)));
        }
    }

    @Override
    public void generate(LLVMFunction f) {
        throw new UnsupportedOperationException();
    }
}
