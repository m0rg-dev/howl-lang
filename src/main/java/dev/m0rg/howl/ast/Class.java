package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.Set;

import dev.m0rg.howl.ast.type.ClassStaticType;
import dev.m0rg.howl.ast.type.ClassType;
import dev.m0rg.howl.ast.type.InterfaceType;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.NewType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;
import dev.m0rg.howl.llvm.LLVMModule;

public class Class extends ObjectCommon implements GeneratesTopLevelItems {
    List<TypeElement> impl;

    public Class(Span span, String name, List<String> generics) {
        super(span, name, generics);
        this.impl = new ArrayList<>();
    }

    @Override
    public ASTElement detach() {
        Class rc = new Class(span, name, new ArrayList<>(generics));
        for (Entry<String, NewType> generic : generic_types.entrySet()) {
            if (generic.getValue().getResolution().isPresent()) {
                rc.setGeneric(generic.getKey(), generic.getValue().getResolution().get());
            }
        }

        for (Entry<String, Field> field : fields.entrySet()) {
            rc.insertField((Field) field.getValue().detach());
        }

        for (Function method : methods) {
            rc.insertMethod((Function) method.detach());
        }

        if (ext.isPresent()) {
            rc.setExtends((NamedType) ext.get().detach());
        }

        for (TypeElement imp : this.impl) {
            rc.insertImplementation((TypeElement) imp.detach());
        }

        return rc;
    }

    @Override
    public String format() {
        StringBuilder rc = new StringBuilder();
        rc.append("class ");
        rc.append(name);

        if (!this.generics.isEmpty()) {
            rc.append("<");
            rc.append(String.join(",", this.generics));
            rc.append(">");
        }

        if (this.ext.isPresent()) {
            rc.append(" extends " + this.ext.get().format());
        }

        if (!this.impl.isEmpty()) {
            rc.append(" implements ");
            List<String> inames = new ArrayList<>(this.impl.size());
            for (TypeElement imp : impl) {
                inames.add(imp.format());
            }
            rc.append(String.join(", ", inames));
        }

        rc.append(" {\n");
        for (Entry<String, NewType> generic : generic_types.entrySet()) {
            rc.append("  " + generic.getValue().format() + ";\n");
        }
        for (Entry<String, Field> field : fields.entrySet()) {
            rc.append("  " + field.getValue().format() + ";\n");
        }

        for (Function method : methods) {
            rc.append("\n" + method.format().indent(2));
        }

        rc.append("}");
        return rc.toString();
    }

    public void insertImplementation(TypeElement impl) {
        this.impl.add((TypeElement) impl.setParent(this));
    }

    public Optional<Function> getConstructor() {
        List<Function> c = getOverloadCandidates("constructor");
        if (c.isEmpty())
            return Optional.empty();
        Function f = c.get(0);
        if (isOwnMethod(f.getName())) {
            return Optional.of(c.get(0));
        } else {
            return Optional.empty();
        }
    }

    public void transform(ASTTransformer t) {
        for (Entry<String, Field> field : fields.entrySet()) {
            field.getValue().transform(t);
            fields.replace(field.getKey(), (Field) t.transform(field.getValue()).setParent(this));
        }

        int index = 0;
        for (Function method : methods) {
            method.transform(t);
            methods.set(index, (Function) t.transform(method).setParent(this));
            index++;
        }

        index = 0;
        for (TypeElement imp : impl) {
            imp.transform(t);
            impl.set(index, (TypeElement) t.transform(imp).setParent(this));
            index++;
        }
    }

    public boolean doesImplement(InterfaceType t) {
        for (TypeElement imp : this.interfaces()) {
            ALambdaTerm res = ALambdaTerm.evaluate(AlgebraicType.deriveNew(imp));
            if (res instanceof AStructureReference) {
                if (t.getSource().getPath().equals(((AStructureReference) res).getSource().getSource().getPath())) {
                    return true;
                }
            }
        }
        if (this.ext.isPresent()) {
            return ((ClassType) this.ext.get().resolve()).getSource().doesImplement(t);
        }
        return false;
    }

    public List<TypeElement> interfaces() {
        Set<TypeElement> rc = new HashSet<>();
        if (this.ext.isPresent()) {
            rc.addAll(((ClassType) this.ext.get().resolve()).getSource().interfaces());
        }
        rc.addAll(impl);
        return Collections.unmodifiableList(new ArrayList<>(rc));
    }

    @Override
    public ClassType getOwnType() {
        return (ClassType) new ClassType(span, this.getPath()).setParent(this);
    }

    public ClassStaticType getStaticType() {
        return (ClassStaticType) new ClassStaticType(span, this.getPath()).setParent(this);
    }

    @Override
    public void generate(LLVMModule module) {
        ;
    }

    public void generateMethods(LLVMModule module) {
    }
}
