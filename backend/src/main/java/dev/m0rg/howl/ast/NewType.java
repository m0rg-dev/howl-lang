package dev.m0rg.howl.ast;

import java.util.Optional;

public class NewType extends TypeElement {
    Optional<TypeElement> resolution;

    public NewType(Span span) {
        super(span);
        this.resolution = Optional.empty();
    }

    @Override
    public String format() {
        StringBuilder rc = new StringBuilder();
        rc.append("type: ");
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

    public void transform(ASTTransformer t) {
        if (this.resolution.isPresent()) {
            this.resolution.get().transform(t);
            this.resolution = Optional.of(t.transform(this.resolution.get()));
        }
    }
}
