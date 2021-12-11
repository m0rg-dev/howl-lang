package dev.m0rg.howl.ast;

// no, this shouldn't extend Statement
public class ImportStatement extends ASTElement {
    String path;

    public ImportStatement(Span span, String path) {
        super(span);
        this.path = path;
    }

    @Override
    public ASTElement detach() {
        ImportStatement rc = new ImportStatement(span, path);
        return rc;
    }

    @Override
    public String format() {
        return "import " + path + ";";
    }

    @Override
    public void transform(ASTTransformer t) {
        ;
    }

    public String getPath() {
        return path;
    }
}
