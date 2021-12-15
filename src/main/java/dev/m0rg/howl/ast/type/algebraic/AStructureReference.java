package dev.m0rg.howl.ast.type.algebraic;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.Set;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Field;
import dev.m0rg.howl.ast.Interface;
import dev.m0rg.howl.ast.Module;
import dev.m0rg.howl.ast.ObjectCommon;
import dev.m0rg.howl.ast.Overload;
import dev.m0rg.howl.ast.type.ClassType;
import dev.m0rg.howl.ast.type.ObjectReferenceType;
import dev.m0rg.howl.llvm.LLVMIntType;
import dev.m0rg.howl.llvm.LLVMModule;
import dev.m0rg.howl.llvm.LLVMPointerType;
import dev.m0rg.howl.llvm.LLVMStructureType;
import dev.m0rg.howl.llvm.LLVMType;
import dev.m0rg.howl.logger.Logger;

public class AStructureReference extends ALambdaTerm implements AStructureType, Applicable, Mangle {
    ObjectReferenceType source;
    Map<String, ALambdaTerm> substitutions;

    public AStructureReference(ObjectReferenceType source) {
        this.source = source;
        this.substitutions = new HashMap<>();
    }

    public ObjectReferenceType getSource() {
        return source;
    }

    @Override
    public String format() {
        if (substitutions.isEmpty()) {
            return "struct " + getSource().getSource().getPath();
        } else {
            List<String> s = new ArrayList<>();
            for (Entry<String, ALambdaTerm> e : substitutions.entrySet()) {
                s.add(e.getKey() + " := " + e.getValue().format());
            }
            return "struct " + getSource().getSource().getPath() + "[" + String.join(", ", s) + "]";
        }
    }

    public Set<String> freeVariables() {
        HashSet<String> rc = new HashSet<>();
        for (Entry<String, ALambdaTerm> s : substitutions.entrySet()) {
            rc.addAll(s.getValue().freeVariables());
        }
        return rc;
    }

    public ALambdaTerm substitute(String from, ALambdaTerm to) {
        AStructureReference rc = new AStructureReference(source);
        rc.substitutions.putAll(substitutions);
        rc.substitutions.put(from, to);
        return rc;
    }

    public ALambdaTerm getField(String name) {
        Optional<ASTElement> src = source.getSource().getField(name).map(x -> x.getOwnType());
        src = src.or(() -> source.getSource().getMethod(name));
        src = src.or(() -> {
            if (source.getSource().getOverloadCandidates(name).size() > 0) {
                return Optional.of(new Overload(source.getSource().getSpan(), name, source));
            } else {
                return Optional.empty();
            }
        });

        ALambdaTerm rc = AlgebraicType.derive(src.get());
        for (Entry<String, ALambdaTerm> s : substitutions.entrySet()) {
            rc = rc.substitute(s.getKey(), s.getValue());
        }
        return rc;
    }

    public boolean hasField(String name) {
        Optional<ASTElement> src = source.getSource().getField(name).map(x -> x.getOwnType());
        src = src.or(() -> source.getSource().getMethod(name));
        src = src.or(() -> {
            if (source.getSource().getOverloadCandidates(name).size() > 0) {
                return Optional.of(new Overload(source.getSource().getSpan(), name, source));
            } else {
                return Optional.empty();
            }
        });

        return src.isPresent();
    }

    public Map<String, ALambdaTerm> getSubstitutions() {
        return Collections.unmodifiableMap(substitutions);
    }

    @Override
    public boolean isApplicable() {
        boolean rc = false;
        for (Entry<String, ALambdaTerm> s : substitutions.entrySet()) {
            if (s.getValue() instanceof Applicable && ((Applicable) s.getValue()).isApplicable()) {
                rc = true;
            }
        }
        return rc;
    }

    @Override
    public ALambdaTerm apply() {
        AStructureReference rc = new AStructureReference(source);
        for (Entry<String, ALambdaTerm> s : substitutions.entrySet()) {
            if (s.getValue() instanceof Applicable && ((Applicable) s.getValue()).isApplicable()) {
                rc.substitutions.put(s.getKey(), ((Applicable) s.getValue()).apply());
            } else {
                rc.substitutions.put(s.getKey(), s.getValue());
            }
        }
        return rc;
    }

    @Override
    public boolean accepts(ALambdaTerm other) {
        if (other instanceof AStructureReference) {
            AStructureReference other_ref = (AStructureReference) other;

            // TODO this is probably too accepting - idea is to allow
            // monomorphizations of the same class to come out OK for
            // constructor overload selection. it'll make sense if you take
            // these blocks out and look at the errors
            if (other_ref.getSource().getSource().original != null) {
                return true;
            }

            if (this.getSource().getSource().original != null) {
                return true;
            }

            if (source.accepts(other_ref.source)) {
                if (other_ref.substitutions.size() == substitutions.size()) {
                    for (Entry<String, ALambdaTerm> s : substitutions.entrySet()) {
                        // structure types have to be equal, not just accepting
                        // to avoid generic havoc later.
                        if (!s.getValue().equals(other_ref.substitutions.get(s.getKey()))) {
                            return false;
                        }
                    }
                    return true;
                }
            }
        } else if (other instanceof AProductType) {
            return ((AProductType) other).accepts(this);
        } else if (other.isFree()) {
            return true;
        }
        return false;
    }

    @Override
    public String mangle() {
        List<String> parts = new ArrayList<>();

        if (this.substitutions.size() > 0) {
            parts.add("T");
            parts.add(Integer.toString(substitutions.size()));
        }

        parts.add("N");
        parts.add(Integer.toString(getSource().getSource().getPath().length()));
        parts.add(getSource().getSource().getPath().replace('.', '_'));

        for (Entry<String, ALambdaTerm> s : substitutions.entrySet()) {
            if (s.getValue() instanceof Mangle) {
                parts.add(((Mangle) s.getValue()).mangle());
            } else {
                throw new RuntimeException(this.format());
            }
        }

        return String.join("", parts);
    }

    public String getSourcePath() {
        return this.getSourceResolved().getSource().getPath();
    }

    public ObjectReferenceType getSourceResolved() {
        if (substitutions.size() > 0) {
            Optional<ASTElement> mmc = ((Module) getSource().getSource().getParent()).getChild(mangle());
            if (mmc.isPresent()) {
                AStructureReference rc = new AStructureReference(((ObjectCommon) mmc.get()).getOwnType());
                return rc.getSourceResolved();
            } else {
                Logger.trace("generate: " + this.format() + " " + this.mangle());
                throw new RuntimeException();
            }
        }
        return this.source;
    }

    static Set<String> structures_generated = new HashSet<>();

    @Override
    public LLVMStructureType toLLVM(LLVMModule module) {
        Logger.trace("AStructureReference generate " + this.format());
        if (substitutions.size() > 0) {
            Optional<ASTElement> mmc = ((Module) getSource().getSource().getParent()).getChild(mangle());
            if (mmc.isPresent()) {
                AStructureReference rc = new AStructureReference(((ObjectCommon) mmc.get()).getOwnType());
                return rc.toLLVM(module);
            } else {
                Logger.trace("generate: " + this.format() + " " + this.mangle());
                throw new RuntimeException();
            }
        }

        String name = getSourcePath();
        LLVMStructureType t;
        if (module.getContext().getStructureType(name).isPresent()) {
            t = module.getContext().getStructureType(name).get();
        } else {
            t = new LLVMStructureType(module.getContext(), name);
        }

        if (t.isOpaqueStruct() && !structures_generated.contains(name)) {
            Logger.trace("Creating structure type: " + name);
            structures_generated.add(name);

            LLVMType object_type, static_type, itable_type;

            if (source instanceof ClassType) {
                object_type = new LLVMPointerType<>(this.generateObjectType(module));
                static_type = new LLVMPointerType<>(this.generateStaticType(module));
                itable_type = new LLVMPointerType<>(new LLVMIntType(module.getContext(), 8));
            } else {
                object_type = new LLVMPointerType<>(this.generateObjectType(module));
                static_type = new LLVMPointerType<>(new LLVMIntType(module.getContext(), 8));
                itable_type = new LLVMPointerType<>(this.generateStaticType(module));
            }
            t.setBody(Arrays.asList(new LLVMType[] { object_type, static_type, itable_type }), true);
        }
        return t;

    }

    public LLVMStructureType generateObjectType(LLVMModule module) {
        String name = getSourcePath() + "_object";
        LLVMStructureType t;
        if (module.getContext().getStructureType(name).isPresent()) {
            t = module.getContext().getStructureType(name).get();
        } else {
            t = new LLVMStructureType(module.getContext(), name);
        }

        if (t.isOpaqueStruct() && !structures_generated.contains(name)) {
            Logger.trace("Creating object type: " + name);
            structures_generated.add(name);

            List<LLVMType> contents = new ArrayList<>();
            for (String fieldname : this.getSource().getFieldNames()) {
                ALambdaTerm fieldtype = ALambdaTerm.evaluate(this.getField(fieldname));
                contents.add(fieldtype.toLLVM(module));
            }
            t.setBody(contents, true);
        }
        return t;
    }

    public LLVMStructureType generateStaticType(LLVMModule module) {
        String name = getSourcePath() + "_static";
        LLVMStructureType t;
        if (module.getContext().getStructureType(name).isPresent()) {
            t = module.getContext().getStructureType(name).get();
        } else {
            t = new LLVMStructureType(module.getContext(), name);
        }

        if (t.isOpaqueStruct() && !structures_generated.contains(name)) {
            Logger.trace("Creating static type: " + name);
            structures_generated.add(name);

            List<LLVMType> contents = new ArrayList<>();
            // name
            contents.add(new LLVMPointerType<>(new LLVMIntType(module.getContext(), 8)));
            // parent
            contents.add(new LLVMPointerType<>(new LLVMIntType(module.getContext(), 8)));
            for (String fieldname : this.getSource().getSource().getMethodNames()) {
                Logger.trace("  => method " + fieldname);
                ALambdaTerm fieldtype = ALambdaTerm.evaluate(this.getField(fieldname));
                contents.add(new LLVMPointerType<>(fieldtype.toLLVM(module)));
            }

            for (Field f : this.getSource().getSource().getFields()) {
                if (f.isStatic()) {
                    contents.add(ALambdaTerm.evaluateFrom(f.getOwnType()).toLLVM(module));
                }
            }
            t.setBody(contents, true);
        }

        return t;
    }

    public int getDepth() {
        int rc = getSource().getSource().getDepth();
        if (getSource().getSource() instanceof Interface) {
            rc = -rc;
        }
        return rc;
    }
}
