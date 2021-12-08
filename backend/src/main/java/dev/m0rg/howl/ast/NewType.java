package dev.m0rg.howl.ast;

import java.util.Optional;

import dev.m0rg.howl.llvm.LLVMModule;
import dev.m0rg.howl.llvm.LLVMType;

public class NewType extends TypeElement implements NamedElement {
    Optional<TypeElement> resolution;
    String name;

    public NewType(Span span, String name) {
        super(span);
        this.resolution = Optional.empty();
        this.name = name;
    }

    @Override
    public ASTElement detach() {
        NewType rc = new NewType(span, name);
        if (this.resolution.isPresent()) {
            rc.setResolution((TypeElement) this.resolution.get().detach());
        }
        return rc;
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

    public Optional<TypeElement> getResolution() {
        return this.resolution;
    }

    public String getName() {
        return this.name;
    }

    public String mangle() {
        return "T" + name.length() + name;
    }

    public void transform(ASTTransformer t) {
        if (this.resolution.isPresent()) {
            this.resolution.get().transform(t);
            this.resolution = Optional.of(t.transform(this.resolution.get()));
        }
    }

    @Override
    public boolean accepts(TypeElement other) {
        if (this.resolution.isPresent()) {
            return this.resolution.get().accepts(other);
        } else {
            return false;
        }
    }

    @Override
    public LLVMType generate(LLVMModule module) {
        throw new UnsupportedOperationException();
    }
}
