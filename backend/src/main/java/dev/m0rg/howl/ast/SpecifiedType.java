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
        base.assertInsertable();
        this.base = (TypeElement) base.setParent(this);
    }

    public void insertParameter(TypeElement parameter) {
        parameter.assertInsertable();
        this.parameters.add((TypeElement) parameter.setParent(this));
    }
}
