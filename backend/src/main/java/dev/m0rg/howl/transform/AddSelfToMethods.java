package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Class;
import dev.m0rg.howl.ast.Field;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.NamedType;

public class AddSelfToMethods implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof Function && e.getParent() instanceof Class) {
            Function f = (Function) e;
            Field self_field = new Field(f.getSpan(), "self");
            self_field.setType(new NamedType(self_field.getSpan(), "Self"));
            f.prependArgument(self_field);
        }
        return e;
    }
}
