package dev.m0rg.howl.ast.type;

import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.llvm.LLVMIntType;
import dev.m0rg.howl.llvm.LLVMModule;
import dev.m0rg.howl.llvm.LLVMType;
import dev.m0rg.howl.llvm.LLVMVoidType;

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
        if (this.name.equals("__numeric")) {
            return "<numeric constant>";
        }

        if (this.name.equals("__error")) {
            return "<error>";
        }

        if (base_types.contains(this.name)) {
            return this.name;
        }

        Optional<ASTElement> target = this.resolveName(this.name);
        if (target.isPresent()) {
            return target.get().getPath();
        }

        return this.name + "?";
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
        if (this.name.equals("__any")) {
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

    @Override
    public LLVMType generate(LLVMModule module) {
        if (this.name.equals("void")) {
            return new LLVMVoidType(module.getContext());
        } else if (this.name.equals("bool")) {
            return new LLVMIntType(module.getContext(), 1);
        } else if (this.name.equals("__numeric")) {
            return new LLVMIntType(module.getContext(), 64);
        } else {
            throw new UnsupportedOperationException("NamedType " + this.name + " @ " + this.getPath());
        }
    }
}
