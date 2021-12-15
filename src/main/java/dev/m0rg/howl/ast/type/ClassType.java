package dev.m0rg.howl.ast.type;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Class;
import dev.m0rg.howl.ast.Span;

public class ClassType extends ObjectReferenceType {
    public ClassType(Span span, String source_path) {
        super(span, source_path);
    }

    @Override
    public ASTElement detach() {
        return new ClassType(span, source_path);
    }

    @Override
    public String format() {
        return "class " + this.source_path;
    }

    public Class getSource() {
        ASTElement target = super.getSource();
        if (target instanceof Class) {
            return (Class) target;
        } else {
            throw new RuntimeException(
                    "ClassType of non-Class " + source_path + "? (" + target.getClass().getName()
                            + ")");
        }
    }

    @Override
    public boolean accepts(TypeElement other) {
        if (other instanceof ClassType) {
            ClassType ct = (ClassType) other;
            if (ct.source_path.equals(this.source_path)) {
                return true;
            }

            if (ct.getSource().getExtends().isPresent()) {
                return this.accepts(ct.getSource().getExtends().get().resolve());
            }

            return false;
        } else {
            return false;
        }
    }
}
