package dev.m0rg.howl.ast.expression;

import java.util.HashMap;
import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.NumericType;
import dev.m0rg.howl.ast.type.RawPointerType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMIntType;
import dev.m0rg.howl.llvm.LLVMPointerType;
import dev.m0rg.howl.llvm.LLVMType;
import dev.m0rg.howl.llvm.LLVMValue;

public class MacroCallExpression extends CallExpressionBase {
    String name;

    public MacroCallExpression(Span span, String name) {
        super(span);
        this.name = name;
    }

    @Override
    public ASTElement detach() {
        MacroCallExpression rc = new MacroCallExpression(span, name);
        copyArguments(rc);
        return rc;
    }

    @Override
    public String format() {
        return "!" + this.name + this.getArgString();
    }

    public void transform(ASTTransformer t) {
        this.transformArguments(t);
    }

    @Override
    public TypeElement getType() {
        if (this.name.equals("sizeof")) {
            return (TypeElement) NumericType.build(span, 64, true).setParent(this);
        } else if (this.name.equals("as_raw") || this.name.equals("get_object_pointer")
                || this.name.equals("get_stable_pointer")) {
            RawPointerType rc = new RawPointerType(span);
            rc.setInner(NumericType.build(span, 8, true));
            return (TypeElement) rc.setParent(this);
        } else if (this.name.equals("pointer_assign")) {
            return (TypeElement) NamedType.build(span, "void").setParent(this);
        } else {
            throw new IllegalArgumentException("unknown macro " + name);
        }
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        addFields(rc);
        return rc;
    }

    @Override
    protected TypeElement getTypeForArgument(int index) {
        return (TypeElement) NamedType.build(this.span, "__any").setParent(this);
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        // TODO all of these things should work differently
        if (this.name.equals("sizeof")) {
            return builder.buildSizeofHack(this.args.get(0).getResolvedType().generate(builder.getModule()));
        } else if (this.name.equals("get_object_pointer")) {
            // idea is to turn a *someclass into a *i8 pointing to its object
            // we'll just cast it to a **i8 and deref accordingly
            LLVMType ppi8 = new LLVMPointerType<>(new LLVMPointerType<>(new LLVMIntType(builder.getContext(), 8)));
            LLVMValue cast = builder.buildBitcast(this.args.get(0).generate(builder), ppi8, "");
            return builder.buildLoad(cast, "");
        } else if (this.name.equals("get_stable_pointer")) {
            TypeElement source_type = this.args.get(0).getResolvedType();
            LLVMValue source_alloca = builder.buildAlloca(source_type.generate(builder.getModule()), "");
            builder.buildStore(this.args.get(0).generate(builder), source_alloca);
            return builder
                    .buildBitcast(builder.buildLoad(builder.buildStructGEP(source_type.generate(builder.getModule()),
                            source_alloca, 1,
                            ""), ""), new LLVMPointerType<>(new LLVMIntType(builder.getContext(), 8)), "");
        } else if (this.name.equals("pointer_assign")) {
            // !pointer_assign(*i8 untyped_source, *T typed_target)
            return builder.buildStore(this.args.get(0).generate(builder),
                    builder.buildBitcast(((Lvalue) this.args.get(1)).getPointer(builder),
                            new LLVMPointerType<>(new LLVMPointerType<>(new LLVMIntType(builder.getContext(), 8))),
                            ""));
        } else if (this.name.equals("as_raw")) {
            // !as_raw(*T typed_source) -> *i8 untyped_value
            return builder.buildBitcast(this.args.get(0).generate(builder),
                    new LLVMPointerType<>(new LLVMIntType(builder.getContext(), 8)),
                    "");
        } else if (this.name.equals("unreachable")) {
            return builder.buildUnreachable();
        } else {
            throw new IllegalArgumentException("unknown macro " + name);
        }
    }
}
