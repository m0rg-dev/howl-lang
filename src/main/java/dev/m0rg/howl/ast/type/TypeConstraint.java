package dev.m0rg.howl.ast.type;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.NamedElement;
import dev.m0rg.howl.ast.Span;

public class TypeConstraint extends ASTElement implements NamedElement {
    String name;
    List<TypeElement> constraints;

    public TypeConstraint(Span span, String name) {
        super(span);
        this.name = name;
        this.constraints = new ArrayList<TypeElement>();
    }

    public String getName() {
        return this.name;
    }

    public void insertConstraint(TypeElement constraint) {
        constraints.add(constraint);
    }

    public List<TypeElement> getConstraints() {
        return Collections.unmodifiableList(constraints);
    }

    @Override
    public ASTElement detach() {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public String format() {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public void transform(ASTTransformer t) {
        // TODO Auto-generated method stub

    }

}
