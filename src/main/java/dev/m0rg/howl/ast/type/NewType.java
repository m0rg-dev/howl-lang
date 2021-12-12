package dev.m0rg.howl.ast.type;

import java.util.Optional;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.NamedElement;
import dev.m0rg.howl.ast.Span;
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
        rc.append(this.name + " (" + getPath() + ")");
        rc.append(" = ");
        if (this.resolution.isPresent()) {
            rc.append(this.resolution.get().format());
        } else {
            rc.append("undef");
        }
        return rc.toString();
    }

    public void setResolution(TypeElement res) {
        if (res instanceof NamedType && ((NamedType) res).getName().equals(this.getPath())) {
            // avoid the cycle
        } else if (res instanceof NamedType && ((NamedType) res).getName().equals("__error")) {
            throw new RuntimeException("do not resolve to error please");
        } else if (res instanceof NamedType && ((NamedType) res).getName().equals("__any")) {
            // this should be equivalent to a no-op because setting to __any
            // doesn't actually specify (but it will break stuff later)
        } else {
            this.resolution = Optional.of((TypeElement) res.setParent(this));
        }
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
        } else if (other instanceof NewType) {
            return this.getPath().equals(other.getPath());
        } else {
            return false;
        }
    }

    @Override
    public LLVMType generate(LLVMModule module) {
        throw new UnsupportedOperationException();
    }

    public boolean isResolved() {
        return this.resolution.isPresent();
    }

    public NewType getRealSource() {
        if (this.resolution.isPresent()) {
            if (this.resolution.get() instanceof NewType) {
                return ((NewType) this.resolution.get()).getRealSource();
            } else {
                return this;
            }
        } else {
            return this;
        }
    }
}
