package dev.m0rg.howl.ast;

import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

public class NamedType extends TypeElement {
    static final Set<String> base_types;

    static {
        Set<String> b = new HashSet<String>();
        b.add("i8");
        b.add("i16");
        b.add("i32");
        b.add("i64");
        b.add("u8");
        b.add("u16");
        b.add("u32");
        b.add("u64");
        b.add("bool");
        b.add("void");
        base_types = Collections.unmodifiableSet(b);
    }

    String name;

    public NamedType(Span span, String name) {
        super(span);
        this.name = name;
    }

    @Override
    public ASTElement detach() {
        return new NamedType(span, name);
    }

    @Override
    public String format() {
        String resolution = "\u001b[31m/* = <unresolved> */\u001b[0m";
        if (base_types.contains(this.name)) {
            resolution = "\u001b[34m/* base */\u001b[0m";
        } else {
            Optional<ASTElement> target = this.resolveName(this.name);
            if (target.isPresent()) {
                resolution = "\u001b[32m/* = " + target.get().getPath() + " */\u001b[0m";
            }
        }
        return "'" + this.name + " " + resolution;
    }

    public void transform(ASTTransformer t) {
        ;
    }
}
