package dev.m0rg.howl.ast.expression;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMValue;

public class SpecifiedTypeExpression extends Expression {
    Expression source;
    List<TypeElement> parameters;

    public SpecifiedTypeExpression(Span span) {
        super(span);
        parameters = new ArrayList<>();
    }

    @Override
    public ASTElement detach() {
        SpecifiedTypeExpression rc = new SpecifiedTypeExpression(span);
        rc.setSource((Expression) source.detach());
        for (TypeElement p : parameters) {
            rc.insertParameter((TypeElement) p.detach());
        }
        return rc;
    }

    @Override
    public String format() {
        List<String> pstrs = new ArrayList<>(this.parameters.size());
        for (TypeElement p : this.parameters) {
            pstrs.add(p.format());
        }
        return this.source.format() + "<" + String.join(", ", pstrs) + ">";
    }

    public Expression getSource() {
        return source;
    }

    public void setSource(Expression source) {
        this.source = (Expression) source.setParent(this);
    }

    public List<TypeElement> getParameters() {
        return Collections.unmodifiableList(parameters);
    }

    public TypeElement getParameter(int index) {
        return parameters.get(index);
    }

    public void insertParameter(TypeElement parameter) {
        parameters.add((TypeElement) parameter.setParent(this));
    }

    public void transform(ASTTransformer t) {
        source.transform(t);
        setSource(t.transform(source));
        for (int i = 0; i < parameters.size(); i++) {
            parameters.get(i).transform(t);
            parameters.set(i, t.transform(parameters.get(i)));
        }
    }

    public LLVMValue generate(LLVMBuilder b) {
        throw new UnsupportedOperationException();
    }

    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        return rc;
    }
}
