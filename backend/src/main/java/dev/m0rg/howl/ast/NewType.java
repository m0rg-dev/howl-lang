package dev.m0rg.howl.ast;

import java.util.Optional;

public class NewType extends TypeElement implements NamedElement {
    Optional<TypeElement> resolution;
    String name;

    public NewType(Span span, String name) {
        super(span);
        this.resolution = Optional.empty();
        this.name = name;
    }

    @Override
    public String format() {
        StringBuilder rc = new StringBuilder();
        rc.append("type ");
        rc.append(name);
        rc.append(" = ");
        if (this.resolution.isPresent()) {
            rc.append(this.resolution.get().format());
        } else {
            rc.append("undef");
        }
        return rc.toString();
    }

    public void setResolution(TypeElement res) {
        this.resolution = Optional.of((TypeElement) res.setParent(this));
    }

    public String getName() {
        return this.name;
    }

    public void transform(ASTTransformer t) {
        if (this.resolution.isPresent()) {
            this.resolution.get().transform(t);
            this.resolution = Optional.of(t.transform(this.resolution.get()));
        }
    }
}
