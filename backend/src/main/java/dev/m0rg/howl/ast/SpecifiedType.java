package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.List;

public class SpecifiedType extends TypeElement {
    TypeElement base;
    List<TypeElement> parameters;

    public SpecifiedType(Span span) {
        super(span);
        this.parameters = new ArrayList<TypeElement>();
    }

    @Override
    public String format() {
        List<String> contents = new ArrayList<String>(this.parameters.size());
        for (TypeElement t : this.parameters) {
            contents.add(t.format());
        }
        return base.format() + "<" + String.join(", ", contents) + ">";
    }

    public void setBase(TypeElement base) {
        this.base = (TypeElement) base.setParent(this);
    }

    public void insertParameter(TypeElement parameter) {
        this.parameters.add((TypeElement) parameter.setParent(this));
    }

    public void transform(ASTTransformer t) {
        this.base.transform(t);
        this.setBase(t.transform(this.base));

        int index = 0;
        for (TypeElement parameter : parameters) {
            parameter.transform(t);
            this.parameters.set(index, (TypeElement) t.transform(parameter).setParent(this));
            index++;
        }
    }
}
