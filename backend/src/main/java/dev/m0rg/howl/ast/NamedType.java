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
        b.add("__any");
        b.add("__error");
        b.add("__numeric");
        base_types = Collections.unmodifiableSet(b);
    }

    String name;

    protected NamedType(Span span, String name) {
        super(span);
        this.name = name;
    }

    public static NamedType build(Span span, String name) {
        NamedType rc = new NamedType(span, name);
        Optional<NumericType> as_numeric = NumericType.try_from(rc);
        if (as_numeric.isPresent()) {
            return as_numeric.get();
        } else {
            return rc;
        }
    }

    @Override
    public ASTElement detach() {
        return new NamedType(span, name);
    }

    @Override
    public String format() {
        String resolution = "\u001b[31m/* = <unresolved> */\u001b[0m";
        if (this.name.equals("__error")) {
            resolution = "\u001b[31;1m/* error */\u001b[0m";
        } else if (base_types.contains(this.name)) {
            resolution = "\u001b[34m/* base */\u001b[0m";
        } else {
            Optional<ASTElement> target = this.resolveName(this.name);
            if (target.isPresent()) {
                resolution = "\u001b[32m/* = " + target.get().getPath() + " */\u001b[0m";
            }
        }
        return "'" + this.name + " " + resolution;
    }

    public boolean isBase() {
        return base_types.contains(this.name);
    }

    public String getName() {
        return name;
    }

    public String mangle() {
        return name.length() + name.replace(".", "_");
    }

    public void transform(ASTTransformer t) {
        ;
    }

    @Override
    public boolean accepts(TypeElement other) {
        if (this.name == "__any") {
            return true;
        } else if (other instanceof NamedType) {
            NamedType nt = (NamedType) other;
            if ((this instanceof NumericType && nt instanceof NumericType)
                    || (this.name.equals("__numeric") && nt instanceof NumericType)) {
                return true;
            }
            return nt.name.equals(this.name) || nt.name.equals("__any");
        } else {
            return false;
        }
    }
}
