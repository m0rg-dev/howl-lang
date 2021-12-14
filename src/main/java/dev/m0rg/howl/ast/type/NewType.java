package dev.m0rg.howl.ast.type;

import java.util.Optional;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.NamedElement;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.llvm.LLVMModule;
import dev.m0rg.howl.llvm.LLVMType;

public class NewType extends TypeElement implements NamedElement {
    Optional<ALambdaTerm> resolution;
    String name;
    int index;

    public NewType(Span span, String name, int index) {
        super(span);
        this.resolution = Optional.empty();
        this.name = name;
        this.index = index;
    }

    @Override
    public ASTElement detach() {
        NewType rc = new NewType(span, name, index);
        if (this.resolution.isPresent()) {
            rc.setResolution(this.resolution.get());
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

    public void setResolution(ALambdaTerm res) {
        this.resolution = Optional.of(res);
    }

    public Optional<ALambdaTerm> getResolution() {
        return this.resolution;
    }

    public String getName() {
        return this.name;
    }

    public int getIndex() {
        return index;
    }

    public String mangle() {
        return "T" + name.length() + name;
    }

    public void transform(ASTTransformer t) {
        ;
    }

    @Override
    public boolean accepts(TypeElement other) {
        throw new RuntimeException();
    }

    @Override
    public LLVMType generate(LLVMModule module) {
        throw new UnsupportedOperationException();
    }

    public boolean isResolved() {
        return this.resolution.isPresent();
    }

    public NewType getRealSource() {
        throw new RuntimeException();

    }
}
