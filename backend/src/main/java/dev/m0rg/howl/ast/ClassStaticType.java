package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import dev.m0rg.howl.llvm.LLVMConstant;
import dev.m0rg.howl.llvm.LLVMGlobalVariable;
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
        return Optional.empty();
    }

    public List<String> getFieldNames() {
        return getSource().getMethodNames();
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
    public LLVMType generate(LLVMModule module) {
        return module.getContext().getOrCreateStructureType(this.getSource().getPath() + "_static", () -> {
            List<LLVMType> contents = new ArrayList<>();
            List<LLVMConstant> methods = new ArrayList<>();
            for (String name : this.getSource().getMethodNames()) {
                Function m = this.getSource().getMethod(name).get();
                contents.add(new LLVMPointerType<LLVMType>(m.getOwnType().resolve().generate(module)));
                methods.add(m.generate(module));
            }

            LLVMStructureType static_type = new LLVMStructureType(module.getContext(),
                    this.getSource().getPath() + "_static");
            static_type.setBody(contents, true);

            LLVMGlobalVariable g = module.getOrInsertGlobal(static_type, this.getSource().getPath() + "_static");
            LLVMConstant stable = static_type.createConstant(module.getContext(), methods);
            g.setInitializer(stable);

            for (NamedType itype : this.getSource().interfaces()) {
                InterfaceType res = (InterfaceType) itype.resolve();
                LLVMStructureType itable_type = res.getSource().getStaticType().generate(module);
                LLVMGlobalVariable itable = module.getOrInsertGlobal(itable_type,
                        this.getSource().getPath() + "_interface_" + res.getSource().getPath());
                List<LLVMConstant> imethods = new ArrayList<>();
                for (String name : res.getSource().getMethodNames()) {
                    Function m = this.getSource().getMethod(name).get();
                    LLVMType method_type = res.getSource().getMethod(name).get().getOwnType().generate(module);
                    imethods.add(m.generate(module).cast(new LLVMPointerType<LLVMType>(method_type)));
                }
                itable.setInitializer(itable_type.createConstant(module.getContext(), imethods));
            }

            return static_type;
        });
    }
}
