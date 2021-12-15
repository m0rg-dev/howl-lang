package dev.m0rg.howl.ast.type;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.llvm.LLVMModule;
import dev.m0rg.howl.llvm.LLVMType;

public class SpecifiedType extends TypeElement {
    TypeElement base;
    List<TypeElement> parameters;

    public SpecifiedType(Span span) {
        super(span);
        this.parameters = new ArrayList<TypeElement>();
    }

    @Override
    public ASTElement detach() {
        SpecifiedType rc = new SpecifiedType(span);
        rc.setBase((TypeElement) base.detach());
        for (TypeElement t : this.parameters) {
            rc.insertParameter((TypeElement) t.detach());
        }
        return rc;
    }

    @Override
    public String format() {
        List<String> contents = new ArrayList<String>(this.parameters.size());
        for (TypeElement t : this.parameters) {
            contents.add(t.format());
        }
        return base.format() + "<" + String.join(", ", contents) + ">";
    }

    public TypeElement getBase() {
        return base;
    }

    public void setBase(TypeElement base) {
        this.base = (TypeElement) base.setParent(this);
    }

    public void insertParameter(TypeElement parameter) {
        this.parameters.add((TypeElement) parameter.setParent(this));
    }

    public List<TypeElement> getParameters() {
        return Collections.unmodifiableList(parameters);
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

    public String mangle() {
        List<String> contents = new ArrayList<String>(this.parameters.size());
        for (TypeElement t : this.parameters) {
            contents.add(t.resolve().mangle());
        }
        return "S" + base.resolve().mangle() + parameters.size() + "E" + String.join("", contents);
    }

    @Override
    public boolean accepts(TypeElement other) {
        return false;
    }

    @Override
    public LLVMType generate(LLVMModule module) {
        throw new UnsupportedOperationException();
    }
}
