package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import dev.m0rg.howl.llvm.LLVMContext;
import dev.m0rg.howl.llvm.LLVMPointerType;
import dev.m0rg.howl.llvm.LLVMStructureType;
import dev.m0rg.howl.llvm.LLVMType;

public class ClassType extends TypeElement implements StructureType {
    String source_path;

    public ClassType(Span span, String source_path) {
        super(span);
        this.source_path = source_path;
    }

    @Override
    public ASTElement detach() {
        return new ClassType(span, source_path);
    }

    @Override
    public String format() {
        return "class " + this.source_path;
    }

    public void transform(ASTTransformer t) {
        ;
    }

    public String mangle() {
        return source_path.length() + source_path.replace(".", "_");
    }

    public Class getSource() {
        Optional<ASTElement> target = this.resolveName(source_path);
        if (target.isPresent() && target.get() instanceof Class) {
            return (Class) target.get();
        } else {
            if (target.isPresent()) {
                throw new RuntimeException(
                        "ClassType of non-Class " + source_path + "? (" + target.get().getClass().getName()
                                + ")");
            } else {
                throw new RuntimeException("ClassType of unresolvable " + source_path + "?");
            }
        }
    }

    public Optional<Field> getField(String name) {
        return getSource().getField(name);
    }

    public List<String> getFieldNames() {
        return getSource().getFieldNames();
    }

    @Override
    public boolean accepts(TypeElement other) {
        if (other instanceof ClassType) {
            ClassType ct = (ClassType) other;
            return ct.source_path.equals(this.source_path);
        } else {
            return false;
        }
    }

    @Override
    public LLVMType generate(LLVMContext context) {
        return context.getOrCreateStructureType(this.getSource().getPath(), () -> {
            LLVMStructureType rc = new LLVMStructureType(context, this.getSource().getPath());

            LLVMStructureType object_type = new LLVMStructureType(context, new ArrayList<>(), true);

            LLVMStructureType static_type = new LLVMStructureType(context, new ArrayList<>(), true);

            List<LLVMType> ty = new ArrayList<>();
            ty.add(new LLVMPointerType<>(object_type));
            ty.add(new LLVMPointerType<>(static_type));
            rc.setBody(ty, true);
            return rc;
        });
    }
}
