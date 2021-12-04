package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class ClassType extends TypeElement {
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
        return this.source_path;
    }

    public void transform(ASTTransformer t) {
        ;
    }

    public String mangle() {
        return source_path.length() + source_path.replace(".", "_");
    }

    public Optional<Field> getField(String name) {
        Optional<ASTElement> target = this.resolveName(source_path);
        if (target.isPresent() && target.get() instanceof Class) {
            return ((Class) target.get()).getField(name);
        } else {
            if (target.isPresent()) {
                throw new RuntimeException(
                        "ClassType of non-Class " + source_path + "? (" + target.get().getClass().getName() + ")");
            } else {
                throw new RuntimeException("ClassType of unresolvable " + source_path + "?");
            }
        }
    }

    public List<String> getFieldNames() {
        Optional<ASTElement> target = this.resolveName(source_path);
        if (target.isPresent() && target.get() instanceof Class) {
            return ((Class) target.get()).getFieldNames();
        } else {
            return new ArrayList<>();
        }
    }
}
