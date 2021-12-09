package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import dev.m0rg.howl.llvm.LLVMIntType;
import dev.m0rg.howl.llvm.LLVMModule;
import dev.m0rg.howl.llvm.LLVMPointerType;
import dev.m0rg.howl.llvm.LLVMStructureType;
import dev.m0rg.howl.llvm.LLVMType;

public class InterfaceType extends TypeElement implements StructureType {
    String source_path;

    public InterfaceType(Span span, String source_path) {
        super(span);
        this.source_path = source_path;
    }

    @Override
    public ASTElement detach() {
        return new InterfaceType(span, source_path);
    }

    @Override
    public String format() {
        return "interface " + this.source_path;
    }

    public void transform(ASTTransformer t) {
        ;
    }

    public String mangle() {
        return source_path.length() + source_path.replace(".", "_");
    }

    public Interface getSource() {
        Optional<ASTElement> target = this.resolveName(source_path);
        if (target.isPresent() && target.get() instanceof Interface) {
            return (Interface) target.get();
        } else {
            if (target.isPresent()) {
                throw new RuntimeException(
                        "InterfaceType of non-Interface " + source_path + "? (" + target.get().getClass().getName()
                                + ")");
            } else {
                throw new RuntimeException("InterfaceType of unresolvable " + source_path + "?");
            }
        }
    }

    public Optional<Field> getField(String name) {
        return Optional.empty();
    }

    public List<String> getFieldNames() {
        return new ArrayList<>();
    }

    @Override
    public boolean accepts(TypeElement other) {
        if (other instanceof InterfaceType) {
            InterfaceType ct = (InterfaceType) other;
            return ct.source_path.equals(this.source_path);
        } else if (other instanceof ClassType) {
            ClassType ct = (ClassType) other;
            return ct.getSource().doesImplement(this);
        } else {
            return false;
        }
    }

    // TODO
    @Override
    public LLVMStructureType generate(LLVMModule module) {
        return module.getContext().getOrCreateStructureType(this.getSource().getPath(), () -> {
            LLVMStructureType rc = new LLVMStructureType(module.getContext(), this.getSource().getPath());

            LLVMType object_type = new LLVMPointerType<LLVMType>(new LLVMIntType(module.getContext(), 8));
            LLVMType static_type = this.getSource().getStaticType().generate(module);

            List<LLVMType> ty = new ArrayList<>();
            ty.add(object_type);
            ty.add(new LLVMPointerType<>(static_type));
            rc.setBody(ty, true);
            return rc;
        });
    }
}
