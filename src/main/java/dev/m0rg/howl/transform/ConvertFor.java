package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.expression.FieldReferenceExpression;
import dev.m0rg.howl.ast.expression.FunctionCallExpression;
import dev.m0rg.howl.ast.expression.NameExpression;
import dev.m0rg.howl.ast.statement.CompoundStatement;
import dev.m0rg.howl.ast.statement.ForStatement;
import dev.m0rg.howl.ast.statement.LocalDefinitionStatement;
import dev.m0rg.howl.ast.statement.Statement;
import dev.m0rg.howl.ast.statement.WhileStatement;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.TypeElement;

public class ConvertFor implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof ForStatement) {
            ForStatement as_for = (ForStatement) e;

            LocalDefinitionStatement iter_def = new LocalDefinitionStatement(e.getSpan(), "__iterator");
            iter_def.setLocaltype(NamedType.build(e.getSpan(), "root.lib.Iterator"));
            iter_def.setInitializer((Expression) as_for.getSource().detach());

            NameExpression iterator_var_ref = new NameExpression(e.getSpan(), "__iterator");

            FieldReferenceExpression next_ref = new FieldReferenceExpression(e.getSpan(), "next");
            next_ref.setSource((NameExpression) iterator_var_ref.detach());

            FunctionCallExpression next_call = new FunctionCallExpression(e.getSpan());
            next_call.setSource(next_ref);

            LocalDefinitionStatement loop_var = new LocalDefinitionStatement(e.getSpan(), as_for.getName());
            loop_var.setLocaltype((TypeElement) as_for.getLocaltype().detach());
            loop_var.setInitializer(next_call);

            FieldReferenceExpression has_next_ref = new FieldReferenceExpression(e.getSpan(), "hasNext");
            has_next_ref.setSource((NameExpression) iterator_var_ref.detach());

            FunctionCallExpression has_next_call = new FunctionCallExpression(e.getSpan());
            has_next_call.setSource(has_next_ref);

            CompoundStatement loop_body = new CompoundStatement(e.getSpan());
            loop_body.insertStatement(loop_var);
            loop_body.insertStatement((Statement) as_for.getBody().detach());

            WhileStatement loop = new WhileStatement(e.getSpan());
            loop.setCondition(has_next_call);
            loop.setBody(loop_body);

            CompoundStatement rc = new CompoundStatement(e.getSpan());
            rc.insertStatement(iter_def);
            rc.insertStatement(loop);

            return rc;
        } else {
            return e;
        }
    }
}
