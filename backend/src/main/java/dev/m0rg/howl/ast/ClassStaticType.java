package dev.m0rg.howl.ast;

import java.util.List;
import java.util.Optional;

public class ClassStaticType extends TypeElement implements StructureType {
    String source_path;

    public ClassStaticType(Span span, String source_path) {
        super(span);
        this.source_path = source_path;
    }

    @Override
    public ASTElement detach() {
        return new ClassStaticType(span, source_path);
    }

    @Override
    public String format() {
        return "static " + this.source_path;
    }

    public void transform(ASTTransformer t) {
        ;
    }

    public String mangle() {
        return "_S" + source_path.length() + source_path.replace(".", "_");
    }

    public Class getSource() {
        Optional<ASTElement> target = this.resolveName(source_path);
        if (target.isPresent() && target.get() instanceof Class) {
            return (Class) target.get();
        } else {
            if (target.isPresent()) {
                throw new RuntimeException(
                        "ClassStaticType of non-Class " + source_path + "? (" + target.get().getClass().getName()
                                + ")");
            } else {
                throw new RuntimeException("ClassStaticType of unresolvable " + source_path + "?");
            }
        }
    }

    public Optional<Field> getField(String name) {
        Field rc = new Field(span, name);
        Optional<Function> source = getSource().getMethod(name);
        if (source.isPresent()) {
            rc.setType((TypeElement) source.get().getOwnType().detach());
            rc.setParent(getSource());
            return Optional.of(rc);
        }
        return Optional.empty();
    }

    public List<String> getFieldNames() {
        return getSource().getMethodNames();
    }

    @Override
    public boolean accepts(TypeElement other) {
        if (other instanceof ClassStaticType) {
            ClassStaticType cst = (ClassStaticType) other;
            return cst.source_path.equals(this.source_path);
        } else {
            return false;
        }
    }
}
