package dev.m0rg.howl.ast.type;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Field;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.llvm.LLVMFunctionType;
import dev.m0rg.howl.llvm.LLVMModule;
import dev.m0rg.howl.llvm.LLVMType;

public class FunctionType extends TypeElement {
    String source_path;

    public FunctionType(Span span, String source_path) {
        super(span);
        this.source_path = source_path;
    }

    @Override
    public ASTElement detach() {
        return new FunctionType(span, source_path);
    }

    @Override
    public String format() {
        return "function " + this.source_path;
    }

    public void transform(ASTTransformer t) {
        ;
    }

    public String mangle() {
        return source_path.length() + source_path.replace(".", "_");
    }

    public Function getSource() {
        Optional<ASTElement> target = this.resolveName(source_path);
        if (target.isPresent() && target.get() instanceof Function) {
            return (Function) target.get();
        } else {
            if (target.isPresent()) {
                throw new RuntimeException(
                        "FunctionType of non-Function " + source_path + "? (" + target.get().getClass().getName()
                                + ")");
            } else {
                throw new RuntimeException("FunctionType of unresolvable " + source_path + "?");
            }
        }
    }

    public boolean isValid() {
        return this.resolveName(source_path).isPresent();
    }

    public List<TypeElement> getArgumentTypes() {
        List<TypeElement> rc = new ArrayList<>();
        for (Field f : getSource().getArgumentList()) {
            rc.add(f.getOwnType());
        }
        return rc;
    }

    public TypeElement getReturnType() {
        return getSource().getReturn();
    }

    @Override
    public boolean accepts(TypeElement other) {
        if (other instanceof FunctionType) {
            FunctionType ft = (FunctionType) other;
            return ft.source_path.equals(this.source_path);
        } else {
            return false;
        }
    }

    @Override
    public LLVMFunctionType generate(LLVMModule module) {
        LLVMType returntype = this.getReturnType().resolve().generate(module);
        List<LLVMType> args = new ArrayList<>(this.getArgumentTypes().size());
        for (TypeElement argtype : this.getArgumentTypes()) {
            args.add(argtype.resolve().generate(module));
        }
        return new LLVMFunctionType(returntype, args);
    }
}
