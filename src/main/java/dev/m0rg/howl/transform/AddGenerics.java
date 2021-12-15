package dev.m0rg.howl.transform;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.ObjectCommon;
import dev.m0rg.howl.ast.Module;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.NewType;
import dev.m0rg.howl.ast.type.ObjectReferenceType;
import dev.m0rg.howl.ast.type.SpecifiedType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.logger.Logger;

public class AddGenerics implements ASTTransformer {
    long index = 0;

    public ASTElement transform(ASTElement e) {
        if (e instanceof NamedType && !((NamedType) e).getName().equals("Self")
                && !(e.getParent() instanceof SpecifiedType)) {
            TypeElement source_type = ((NamedType) e).resolve();
            if (source_type instanceof ObjectReferenceType) {
                ObjectReferenceType ort = (ObjectReferenceType) source_type;
                if (ort.getSource().isGeneric()) {
                    Logger.trace("AddGenerics " + e.format());
                    Optional<ObjectCommon> o = e.nearestObject();
                    Optional<Module> m = e.nearestModule();
                    List<TypeElement> new_parameters = new ArrayList<>();

                    for (String generic : ort.getSource().getGenericNames()) {
                        String name = "__infer_" + index + "_" + generic;
                        if (o.isPresent()) {
                            o.get().insertNewtype(name);
                        } else {
                            m.get().insertItem(new NewType(e.getSpan(), name, -1));
                        }
                        new_parameters.add(NamedType.build(e.getSpan(), name));
                    }
                    index++;

                    SpecifiedType rc = new SpecifiedType(e.getSpan());
                    rc.setBase((TypeElement) ort.detach());
                    for (TypeElement p : new_parameters) {
                        rc.insertParameter(p);
                    }
                    return rc;
                }
            }
        }
        return e;
    }
}
