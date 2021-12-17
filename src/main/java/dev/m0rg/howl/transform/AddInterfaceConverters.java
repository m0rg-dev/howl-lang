package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Argument;
import dev.m0rg.howl.ast.Class;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.expression.CastToInterfaceExpression;
import dev.m0rg.howl.ast.expression.NameExpression;
import dev.m0rg.howl.ast.statement.CompoundStatement;
import dev.m0rg.howl.ast.statement.ReturnStatement;
import dev.m0rg.howl.ast.type.InterfaceType;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;

public class AddInterfaceConverters implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof Class) {
            Class c = (Class) e;
            for (TypeElement t : c.interfaces()) {
                ALambdaTerm t_impl = ALambdaTerm.evaluate(AlgebraicType.derive(t));
                if (t_impl instanceof AStructureReference) {
                    TypeElement resolved = ((AStructureReference) t_impl).getSource();
                    if (resolved instanceof InterfaceType) {
                        InterfaceType it = (InterfaceType) resolved;

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
                        ice.setTarget(AlgebraicType.derive(t));
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
