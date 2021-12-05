package dev.m0rg.howl.ast;

import java.util.List;
import java.util.Optional;

public class ClassType extends TypeElement implements StructureType {
    String source_path;

    public ClassType(Span span, String source_path) {
        super(span);
        this.source_path = source_path;
    }

    @Override
    public ASTElement detach() {
        return new ClassType(span, source_path);
    }

    @Override
    public String format() {
        return "class " + this.source_path;
    }

    public void transform(ASTTransformer t) {
        ;
    }

    public String mangle() {
        return source_path.length() + source_path.replace(".", "_");
    }

    public Class getSource() {
        Optional<ASTElement> target = this.resolveName(source_path);
        if (target.isPresent() && target.get() instanceof Class) {
            return (Class) target.get();
        } else {
            if (target.isPresent()) {
                throw new RuntimeException(
                        "ClassType of non-Class " + source_path + "? (" + target.get().getClass().getName()
                                + ")");
            } else {
                throw new RuntimeException("ClassType of unresolvable " + source_path + "?");
            }
        }
    }

    public Optional<Field> getField(String name) {
        return getSource().getField(name);
    }

    public List<String> getFieldNames() {
        return getSource().getFieldNames();
    }

    @Override
    public boolean accepts(TypeElement other) {
        if (other instanceof ClassType) {
            ClassType ct = (ClassType) other;
            return ct.source_path.equals(this.source_path);
        } else {
            return false;
        }
    }
}
