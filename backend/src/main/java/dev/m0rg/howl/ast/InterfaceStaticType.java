package dev.m0rg.howl.ast;

import java.util.List;
import java.util.Optional;

public class InterfaceStaticType extends TypeElement implements StructureType {
    String source_path;

    public InterfaceStaticType(Span span, String source_path) {
        super(span);
        this.source_path = source_path;
    }

    @Override
    public ASTElement detach() {
        return new InterfaceStaticType(span, source_path);
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

    public Interface getSource() {
        Optional<ASTElement> target = this.resolveName(source_path);
        if (target.isPresent() && target.get() instanceof Interface) {
            return (Interface) target.get();
        } else {
            if (target.isPresent()) {
                throw new RuntimeException(
                        "InterfaceStaticType of non-Interface " + source_path + "? ("
                                + target.get().getClass().getName()
                                + ")");
            } else {
                throw new RuntimeException("InterfaceStaticType of unresolvable " + source_path + "?");
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
        if (other instanceof InterfaceStaticType) {
            InterfaceStaticType ist = (InterfaceStaticType) other;
            return ist.source_path.equals(this.source_path);
        } else {
            return false;
        }
    }
}
