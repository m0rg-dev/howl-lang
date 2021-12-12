package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Argument;
import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Class;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.expression.CastToInterfaceExpression;
import dev.m0rg.howl.ast.expression.NameExpression;
import dev.m0rg.howl.ast.statement.CompoundStatement;
import dev.m0rg.howl.ast.statement.ReturnStatement;
import dev.m0rg.howl.ast.type.InterfaceType;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.logger.Logger;

public class AddInterfaceConverters implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof Class) {
            Class c = (Class) e;
            if (!c.isGeneric()) {
                Logger.trace("AddInterfaceConverters " + e.getPath());
                for (TypeElement t : c.interfaces()) {
                    TypeElement resolved = t.resolve();
                    if (resolved instanceof InterfaceType) {
                        InterfaceType it = (InterfaceType) resolved;
                        Logger.trace("  => " + it.getSource().getPath());

                        Function converter = new Function(e.getSpan(), false, false,
                                "__as_" + it.getSource().getPath().replace('.', '_'));
                        converter.setReturn((TypeElement) t.detach());
                        Argument self_field = new Argument(converter.getSpan(), "self");
                        self_field.setType(NamedType.build(self_field.getSpan(), "Self"));
                        converter.prependArgument(self_field);

                        CompoundStatement body = new CompoundStatement(converter.getSpan());
                        ReturnStatement rc = new ReturnStatement(converter.getSpan());
                        CastToInterfaceExpression ice = new CastToInterfaceExpression(converter.getSpan());
                        ice.setSource(new NameExpression(converter.getSpan(), "self"));
                        ice.setTarget((TypeElement) it.detach());
                        rc.setSource(ice);
                        body.insertStatement(rc);
                        converter.setBody(body);

                        c.insertMethod(converter);
                    } else {
                        e.getSpan().addError("can't find interface " + t.format());
                    }
                }
            }
            return e;
        } else {
            return e;
        }
    }

}
