package dev.m0rg.howl.transform;

import java.util.Optional;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Class;
import dev.m0rg.howl.ast.Module;
import dev.m0rg.howl.ast.NameHolder;
import dev.m0rg.howl.ast.expression.NameExpression;
import dev.m0rg.howl.ast.expression.SpecifiedTypeExpression;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.SpecifiedType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.logger.Logger;
import dev.m0rg.howl.logger.Logger.LogLevel;

public class MonomorphizeClasses implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof SpecifiedType) {
            SpecifiedType st = (SpecifiedType) e;
            if (st.getBase() instanceof NamedType) {
                NamedType base = (NamedType) st.getBase();
                Optional<ASTElement> target = base.resolveName(base.getName());
                if (target.isPresent() && target.get() instanceof Class) {
                    if (((NameHolder) target.get().getParent()).getChild(st.mangle()).isPresent()) {
                        return NamedType.build(st.getSpan(),
                                ((NameHolder) target.get().getParent()).getChild(st.mangle()).get().getPath());
                    } else {
                        Logger.log(LogLevel.Trace, "Monomorphize: " + st.mangle());
                        Class specified = (Class) target.get().detach();
                        specified.setName(st.mangle());
                        for (int i = 0; i < st.getParameters().size(); i++) {
                            specified.setGeneric(specified.getGenericNames().get(i),
                                    (TypeElement) st.getParameters().get(i).detach());
                        }
                        specified.clearGenerics();
                        if (target.get().getParent() instanceof Module) {
                            Module m = (Module) target.get().getParent();
                            m.insertItem(specified);
                            return NamedType.build(st.getSpan(), specified.getPath());
                        } else {
                            throw new RuntimeException();
                        }

                    }
                } else {
                    throw new RuntimeException("COMPILATION-ERROR specification of non-class " + base.format());
                }
            } else {
                throw new RuntimeException("COMPILATION-ERROR specification of non-named");
            }
        } else if (e instanceof SpecifiedTypeExpression) {
            SpecifiedTypeExpression ste = (SpecifiedTypeExpression) e;
            TypeElement synthesized_type = ste.getType();
            if (synthesized_type instanceof SpecifiedType) {
                TypeElement transformed = this.transform(synthesized_type);
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
}
