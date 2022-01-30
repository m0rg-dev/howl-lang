package dev.m0rg.howl.ast.statement;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.llvm.LLVMFunction;
import dev.m0rg.howl.logger.Logger;

public abstract class Statement extends ASTElement {
    Optional<Annotation> annotation;

    public Statement(Span span) {
        super(span);
        this.annotation = Optional.empty();
    }

    public Map<String, String> getAnnotations() {
        if (annotation.isPresent()) {
            return annotation.get().getContents();
        } else {
            return new HashMap<>();
        }
    }

    public void setAnnotation(Annotation a) {
        this.annotation = Optional.of((Annotation) a.setParent(this));
    }

    public void setAnnotation(Optional<Annotation> annotation) {
        this.annotation = annotation.map(x -> (Annotation) x.setParent(this));
    }

    public abstract void generate(LLVMFunction f);

    public Function getContainingFunction() {
        ASTElement p = this.getParent();
        while (!(p instanceof Function))
            p = p.getParent();
        return (Function) p;
    }
}
