package dev.m0rg.howl.ast.type;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Class;
import dev.m0rg.howl.ast.Field;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.llvm.LLVMIntType;
import dev.m0rg.howl.llvm.LLVMModule;
import dev.m0rg.howl.llvm.LLVMPointerType;
import dev.m0rg.howl.llvm.LLVMStructureType;
import dev.m0rg.howl.llvm.LLVMType;

public class ClassStaticType extends TypeElement implements StructureType {
    String source_path;

    public ClassStaticType(Span span, String source_path) {
        super(span);
        this.source_path = source_path;
    }

    @Override
    public ASTElement detach() {
        return new ClassStaticType(span, source_path);
    }

    @Override
    public String format() {
        return "static " + this.source_path;
    }

    public void transform(ASTTransformer t) {
        ;
    }

    public String mangle() {
        return "_S" + source_path.length() + source_path.replace(".", "_");
    }

    public Class getSource() {
        Optional<ASTElement> target = this.resolveName(source_path);
        if (target.isPresent() && target.get() instanceof Class) {
            return (Class) target.get();
        } else {
            if (target.isPresent()) {
                throw new RuntimeException(
                        "ClassStaticType of non-Class " + source_path + "? (" + target.get().getClass().getName()
                                + ")");
            } else {
                throw new RuntimeException("ClassStaticType of unresolvable " + source_path + "?");
            }
        }
    }

    public Optional<Field> getField(String name) {
        Field rc = new Field(span, name);
        Optional<Function> source = getSource().getMethod(name);
        if (source.isPresent()) {
            rc.setType((TypeElement) source.get().getOwnType().detach());
            rc.setParent(getSource());
            return Optional.of(rc);
        }
        Optional<Field> field_source = getSource().getField(name);
        if (field_source.isPresent() && field_source.get().isStatic()) {
            return field_source;
        }
        return Optional.empty();
    }

    public List<String> getFieldNames() {
        List<String> methods = getSource().getMethodNames();
        List<String> rc = new ArrayList<>();
        rc.add("__name");
        rc.add("__parent");
        rc.addAll(methods);
        for (Field f : this.getSource().getFields()) {
            if (f.isStatic()) {
                rc.add(f.getName());
            }
        }
        return rc;
    }

    @Override
    public boolean accepts(TypeElement other) {
        if (other instanceof ClassStaticType) {
            ClassStaticType cst = (ClassStaticType) other;
            return cst.source_path.equals(this.source_path);
        } else {
            return false;
        }
    }

    @Override
    public LLVMStructureType generate(LLVMModule module) {
        return module.getContext().getOrCreateStructureType(this.getSource().getPath() + "_stable", () -> {
            List<LLVMType> contents = new ArrayList<>();
            // name
            contents.add(new LLVMPointerType<>(new LLVMIntType(module.getContext(), 8)));
            // parent
            contents.add(new LLVMPointerType<>(new LLVMIntType(module.getContext(), 8)));
            for (String name : this.getSource().getMethodNames()) {
                Function m = this.getSource().getMethod(name).get();
                contents.add(new LLVMPointerType<LLVMType>(m.getOwnType().resolve().generate(module)));
            }
            for (Field f : this.getSource().getFields()) {
                if (f.isStatic()) {
                    contents.add(f.getOwnType().resolve().generate(module));
                }
            }

            LLVMStructureType static_type = new LLVMStructureType(module.getContext(),
                    this.getSource().getPath() + "_stable");
            static_type.setBody(contents, true);

            return static_type;
        });
    }
}
