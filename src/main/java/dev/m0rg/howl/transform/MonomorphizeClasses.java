package dev.m0rg.howl.transform;

import java.util.Optional;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Class;
import dev.m0rg.howl.ast.Module;
import dev.m0rg.howl.ast.NameHolder;
import dev.m0rg.howl.ast.NamedType;
import dev.m0rg.howl.ast.SpecifiedType;
import dev.m0rg.howl.ast.TypeElement;
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
                    throw new RuntimeException("COMPILATION-ERROR specification of non-class");
                }
            } else {
                throw new RuntimeException("COMPILATION-ERROR specification of non-named");
            }
        } else {
            return e;
        }
    }
}
