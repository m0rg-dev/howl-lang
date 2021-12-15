package dev.m0rg.howl.ast.type;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Interface;
import dev.m0rg.howl.ast.Span;

public class InterfaceType extends ObjectReferenceType {
    public InterfaceType(Span span, String source_path) {
        super(span, source_path);
    }

    @Override
    public ASTElement detach() {
        return new InterfaceType(span, source_path);
    }

    @Override
    public String format() {
        return "interface " + this.source_path;
    }

    public Interface getSource() {
        ASTElement target = super.getSource();
        if (target instanceof Interface) {
            return (Interface) target;
        } else {
            throw new RuntimeException(
                    "InterfaceType of non-Interface " + source_path + "? (" + target.getClass().getName()
                            + ")");
        }
    }

    @Override
    public boolean accepts(TypeElement other) {
        if (other instanceof InterfaceType) {
            InterfaceType ct = (InterfaceType) other;
            return ct.source_path.equals(this.source_path);
        } else if (other instanceof ClassType) {
            ClassType ct = (ClassType) other;
            return ct.getSource().doesImplement(this);
        } else {
            return false;
        }
    }
}
