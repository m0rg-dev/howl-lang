package dev.m0rg.howl.ast.type;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Span;

public class LambdaType extends FunctionType {
    TypeElement returntype;
    List<TypeElement> args;

    public LambdaType(Span span) {
        super(span, "lambda");
        args = new ArrayList<>();
    }

    @Override
    public ASTElement detach() {
        LambdaType rc = new LambdaType(span);
        rc.setReturn((TypeElement) this.returntype.detach());
        for (TypeElement a : args) {
            rc.insertArgument((TypeElement) a.detach());
        }
        return rc;
    }

    public void insertArgument(TypeElement arg) {
        args.add((TypeElement) arg.setParent(this));
    }

    public void setReturn(TypeElement rc) {
        this.returntype = (TypeElement) rc.setParent(this);
    }

    @Override
    public String format() {
        List<String> afmt = new ArrayList<>();
        for (TypeElement a : args) {
            afmt.add(a.format());
        }

        return "fn " + this.returntype.format() + "(" + String.join(", ", afmt) + ")";
    }

    @Override
    public boolean isValid() {
        return true;
    }

    @Override
    public List<TypeElement> getArgumentTypes() {
        return Collections.unmodifiableList(args);
    }

    @Override
    public TypeElement getReturnType() {
        return returntype;
    }

    @Override
    public boolean accepts(TypeElement other) {
        if (other instanceof FunctionType) {
            FunctionType ft = (FunctionType) other;
            if (!ft.getReturnType().acceptsReflexive(this.returntype)) {
                return false;
            }
            List<TypeElement> other_args = ft.getArgumentTypes();
            if (other_args.size() != this.args.size()) {
                return false;
            }
            for (int i = 0; i < this.args.size(); i++) {
                if (!args.get(i).acceptsReflexive(other_args.get(i))) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    }
}
