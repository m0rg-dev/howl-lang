package dev.m0rg.howl.ast.type;

import java.util.ArrayList;
import java.util.List;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Interface;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.llvm.LLVMIntType;
import dev.m0rg.howl.llvm.LLVMModule;
import dev.m0rg.howl.llvm.LLVMPointerType;
import dev.m0rg.howl.llvm.LLVMStructureType;
import dev.m0rg.howl.llvm.LLVMType;

public class InterfaceType extends ObjectReferenceType {
    public InterfaceType(Span span, String source_path) {
        super(span, source_path);
    }

    @Override
    public ASTElement detach() {
        return new InterfaceType(span, source_path);
    }

    @Override
    public String format() {
        return "interface " + this.source_path;
    }

    public Interface getSource() {
        ASTElement target = super.getSource();
        if (target instanceof Interface) {
            return (Interface) target;
        } else {
            throw new RuntimeException(
                    "InterfaceType of non-Interface " + source_path + "? (" + target.getClass().getName()
                            + ")");
        }
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
            LLVMType object_stable_pointer = new LLVMPointerType<LLVMType>(new LLVMIntType(module.getContext(), 8));
            List<LLVMType> ty = new ArrayList<>();
            ty.add(object_type);
            ty.add(object_stable_pointer);
            ty.add(new LLVMPointerType<>(static_type));
            rc.setBody(ty, true);
            return rc;
        });
    }
}
