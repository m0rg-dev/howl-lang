package dev.m0rg.howl.transform;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.function.Consumer;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Class;
import dev.m0rg.howl.ast.Interface;
import dev.m0rg.howl.ast.Module;
import dev.m0rg.howl.ast.NameHolder;
import dev.m0rg.howl.ast.expression.NameExpression;
import dev.m0rg.howl.ast.expression.SpecifiedTypeExpression;
import dev.m0rg.howl.ast.type.ClassType;
import dev.m0rg.howl.ast.type.InterfaceType;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.SpecifiedType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.logger.Logger;
import dev.m0rg.howl.logger.Logger.LogLevel;

public class MonomorphizeClasses implements ASTTransformer {
    List<SpecifiedType> outstanding_types;

    public MonomorphizeClasses() {
        outstanding_types = new LinkedList<>();
    }

    NamedType generateIfNecessary(SpecifiedType st, Consumer<NamedType> gen_callback) {
        TypeElement base_resolved = st.getBase().resolve();
        if (base_resolved instanceof ClassType) {
            Class target = ((ClassType) base_resolved).getSource();
            if (((NameHolder) target.getParent()).getChild(st.mangle()).isPresent()) {
                return NamedType.build(st.getSpan(),
                        ((NameHolder) target.getParent()).getChild(st.mangle()).get().getPath());
            } else {
                Logger.log(LogLevel.Trace, "Monomorphize: " + st.mangle() + " (" + st.format() + ")");
                Class specified = (Class) target.detach();
                specified.setName(st.mangle());
                for (int i = 0; i < st.getParameters().size(); i++) {
                    specified.setGeneric(specified.getGenericNames().get(i),
                            (TypeElement) st.getParameters().get(i).resolve().detach());
                }
                specified.clearGenerics();
                if (target.getParent() instanceof Module) {
                    Module m = (Module) target.getParent();
                    m.insertItem(specified);
                    NamedType rc = (NamedType) NamedType.build(st.getSpan(), specified.getPath())
                            .setParent(st.getParent());
                    gen_callback.accept(rc);
                    return rc;
                } else {
                    throw new RuntimeException();
                }
            }
        } else if (base_resolved instanceof InterfaceType) {
            // TODO: DRY
            Interface target = ((InterfaceType) base_resolved).getSource();
            if (((NameHolder) target.getParent()).getChild(st.mangle()).isPresent()) {
                return NamedType.build(st.getSpan(),
                        ((NameHolder) target.getParent()).getChild(st.mangle()).get().getPath());
            } else {
                Logger.log(LogLevel.Trace, "Monomorphize: interface " + st.mangle() + " (" + st.format() + ")");
                Interface specified = (Interface) target.detach();
                specified.setName(st.mangle());
                for (int i = 0; i < st.getParameters().size(); i++) {
                    specified.setGeneric(specified.getGenericNames().get(i),
                            (TypeElement) st.getParameters().get(i).resolve().detach());
                }
                specified.clearGenerics();
                if (target.getParent() instanceof Module) {
                    Module m = (Module) target.getParent();
                    m.insertItem(specified);
                    return NamedType.build(st.getSpan(), specified.getPath());
                } else {
                    throw new RuntimeException();
                }
            }
        } else {
            st.getSpan().addError("specification of non-class");
            return NamedType.build(st.getSpan(), "__error");
        }
    }

    public void generate() {
        boolean generated = false;
        while (outstanding_types.size() > 0) {
            generated = false;
            List<SpecifiedType> alias = new ArrayList<>(outstanding_types);
            Logger.trace("MonomorphizeClasses: " + alias.size() + " types remaining");
            for (SpecifiedType t : alias) {
                Logger.trace(
                        "MonomorphizeClasses: " + t.format() + " " + (isSpecifiable(t) ? Logger.OK : Logger.Error));
                if (isSpecifiable(t)) {
                    generated = true;
                    NamedType newtype = generateIfNecessary(t, (NamedType ty) -> {
                        ASTElement res = ty.resolve();
                        if (res instanceof ClassType) {
                            ((ClassType) res).getSource().transform(this.getFinder());
                        } else if (res instanceof InterfaceType) {
                            ((InterfaceType) res).getSource().transform(this.getFinder());
                        } else {
                            throw new RuntimeException(ty.getName());
                        }
                    });

                    Logger.trace("  -> " + newtype.resolve().format());
                }
                outstanding_types.remove(t);
            }
            if (!generated) {
                throw new RuntimeException("type resolution did not converge");
            }
        }
    }

    public boolean isSpecifiable(SpecifiedType t) {
        if (t.getBase().resolveIfConcrete().isEmpty()) {
            return false;
        }

        for (TypeElement param : t.getParameters()) {
            if (param instanceof SpecifiedType) {
                if (!isSpecifiable((SpecifiedType) param)) {
                    return false;
                }
            } else if (param.resolveIfConcrete().isEmpty()) {
                return false;
            }
        }

        return true;
    }

    public ASTElement transform(ASTElement e) {
        if (e instanceof SpecifiedType) {
            // avoid generating T<__any>s - we already figured out what
            // is and isn't valid
            if (isSpecifiable((SpecifiedType) e)) {
                return generateIfNecessary((SpecifiedType) e, (NamedType t) -> {
                });
            } else {
                return e;
            }
        } else if (e instanceof SpecifiedTypeExpression) {
            SpecifiedTypeExpression ste = (SpecifiedTypeExpression) e;
            TypeElement synthesized_type = ste.getType();
            if (synthesized_type instanceof SpecifiedType) {
                TypeElement transformed = generateIfNecessary((SpecifiedType) synthesized_type, (NamedType t) -> {
                });
                if (transformed instanceof NamedType) {
                    return new NameExpression(e.getSpan(), ((NamedType) transformed).getName());
                }
                throw new RuntimeException("frick " + transformed.format());
            } else {
                throw new RuntimeException("COMPILATION-ERROR some kind of specification problem");
            }
        } else {
            return e;
        }
    }

    public ASTTransformer getFinder() {
        return new Finder(this);
    }

    class Finder implements ASTTransformer {
        MonomorphizeClasses t;

        Finder(MonomorphizeClasses t) {
            this.t = t;
        }

        public ASTElement transform(ASTElement e) {
            if (e instanceof SpecifiedType) {
                Logger.trace("adding: " + e.format());
                t.outstanding_types.add((SpecifiedType) e);
            } else if (e instanceof SpecifiedTypeExpression) {
                SpecifiedTypeExpression ste = (SpecifiedTypeExpression) e;
                TypeElement synthesized_type = ste.getType();
                if (synthesized_type instanceof SpecifiedType) {
                    t.outstanding_types.add((SpecifiedType) synthesized_type);
                } else {
                    throw new RuntimeException("COMPILATION-ERROR some kind of specification problem");
                }
            }
            return e;
        }
    }
}
