package dev.m0rg.howl.ast;

// no, this shouldn't extend Statement
public class ModStatement extends ASTElement {
    String path;

    public ModStatement(Span span, String path) {
        super(span);
        this.path = path;
    }

    @Override
    public ASTElement detach() {
        ModStatement rc = new ModStatement(span, path);
        return rc;
    }

    @Override
    public String format() {
        return "mod " + path + ";";
    }

    @Override
    public void transform(ASTTransformer t) {
        ;
    }

    public String getPath() {
        return path;
    }
}
