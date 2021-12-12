package dev.m0rg.howl.ast.type;

import java.util.ArrayList;
import java.util.List;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Class;
import dev.m0rg.howl.ast.Field;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.llvm.LLVMModule;
import dev.m0rg.howl.llvm.LLVMPointerType;
import dev.m0rg.howl.llvm.LLVMStructureType;
import dev.m0rg.howl.llvm.LLVMType;

public class ClassType extends ObjectType {
    public ClassType(Span span, String source_path) {
        super(span, source_path);
    }

    @Override
    public ASTElement detach() {
        return new ClassType(span, source_path);
    }

    @Override
    public String format() {
        return "class " + this.source_path;
    }

    public Class getSource() {
        ASTElement target = super.getSource();
        if (target instanceof Class) {
            return (Class) target;
        } else {
            throw new RuntimeException(
                    "ClassType of non-Class " + source_path + "? (" + target.getClass().getName()
                            + ")");
        }
    }

    @Override
    public boolean accepts(TypeElement other) {
        if (other instanceof ClassType) {
            ClassType ct = (ClassType) other;
            if (ct.source_path.equals(this.source_path)) {
                return true;
            }

            if (ct.getSource().getExtends().isPresent()) {
                return ct.getSource().getExtends().get().resolve().accepts(this);
            }

            return false;
        } else {
            return false;
        }
    }

    public LLVMStructureType generateObjectType(LLVMModule module) {
        return module.getContext().getOrCreateStructureType(this.getSource().getPath() + "_object", () -> {
            List<LLVMType> contents = new ArrayList<>();
            for (String name : this.getSource().getFieldNames()) {
                Field f = this.getSource().getField(name).get();
                contents.add(f.getOwnType().resolve().generate(module));
            }
            LLVMStructureType object_type = new LLVMStructureType(module.getContext(),
                    this.getSource().getPath() + "_object");
            object_type.setBody(contents, true);
            return object_type;
        });
    }

    @Override
    public LLVMType generate(LLVMModule module) {
        return module.getContext().getOrCreateStructureType(this.getSource().getPath(), () -> {
            LLVMStructureType rc = new LLVMStructureType(module.getContext(), this.getSource().getPath());

            LLVMStructureType object_type = this.generateObjectType(module);
            LLVMType static_type = this.getSource().getStaticType().generate(module);

            List<LLVMType> ty = new ArrayList<>();
            ty.add(new LLVMPointerType<>(object_type));
            ty.add(new LLVMPointerType<>(static_type));
            rc.setBody(ty, true);
            return rc;
        });
    }
}
