package dev.m0rg.howl.ast.type;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Map.Entry;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.statement.Statement;
import dev.m0rg.howl.llvm.LLVMFunction;

// we extend Statement here just so that things won't blow up when you have one
// in a CompoundStatement
public class Annotation extends Statement {
    LinkedHashMap<String, String> contents;

    public Annotation(Span span, Map<String, String> contents) {
        super(span);
        this.contents = new LinkedHashMap<String, String>(contents);
    }

    public Map<String, String> getContents() {
        return Collections.unmodifiableMap(contents);
    }

    @Override
    public void generate(LLVMFunction f) {
        throw new UnsupportedOperationException();
    }

    @Override
    public ASTElement detach() {
        return new Annotation(span, contents);
    }

    @Override
    public String format() {
        List<String> contents_rendered = new ArrayList<>();

        for (Entry<String, String> c : contents.entrySet()) {
            contents_rendered.add(c.getKey() + " = " + c.getValue());
        }

        return "#[" + String.join(", ", contents_rendered) + "]";
    }

    @Override
    public void transform(ASTTransformer t) {
        ;
    }

}
