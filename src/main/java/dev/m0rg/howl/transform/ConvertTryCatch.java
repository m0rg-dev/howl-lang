package dev.m0rg.howl.transform;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.expression.ArithmeticExpression;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.expression.FunctionCallExpression;
import dev.m0rg.howl.ast.expression.NameExpression;
import dev.m0rg.howl.ast.expression.NumberExpression;
import dev.m0rg.howl.ast.statement.CompoundStatement;
import dev.m0rg.howl.ast.statement.IfStatement;
import dev.m0rg.howl.ast.statement.LocalDefinitionStatement;
import dev.m0rg.howl.ast.statement.SimpleStatement;
import dev.m0rg.howl.ast.statement.Statement;
import dev.m0rg.howl.ast.statement.TryStatement;
import dev.m0rg.howl.ast.type.NumericType;
import dev.m0rg.howl.ast.type.RawPointerType;
import dev.m0rg.howl.ast.type.TypeElement;

public class ConvertTryCatch implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof TryStatement) {
            TryStatement as_try = (TryStatement) e;

            RawPointerType pi8 = new RawPointerType(e.getSpan());
            pi8.setInner(NumericType.build(e.getSpan(), 8, true));
            NameExpression handler = new NameExpression(e.getSpan(), "__handler");

            NameExpression push = new NameExpression(e.getSpan(), "lib.Exception.__exc_push");
            FunctionCallExpression push_call = new FunctionCallExpression(e.getSpan());
            push_call.setSource(push);

            LocalDefinitionStatement handler_buf = new LocalDefinitionStatement(e.getSpan(), "__handler");
            handler_buf.setLocaltype((TypeElement) pi8.detach());
            handler_buf.setInitializer(push_call);

            NameExpression get = new NameExpression(e.getSpan(), "lib.Exception.__jmp_buf");
            FunctionCallExpression get_call = new FunctionCallExpression(e.getSpan());
            get_call.setSource(get);

            NameExpression enter = new NameExpression(e.getSpan(), "lib.Exception.setjmp");
            FunctionCallExpression enter_call = new FunctionCallExpression(e.getSpan());
            enter_call.setSource(enter);
            enter_call.insertArgument(get_call);

            NumberExpression zero = new NumberExpression(e.getSpan(), "0");
            ArithmeticExpression comparison = new ArithmeticExpression(e.getSpan(), "==");
            comparison.setLHS(enter_call);
            comparison.setRHS(zero);

            IfStatement if_statement = new IfStatement(e.getSpan());
            if_statement.setCondition(comparison);

            NameExpression pop = new NameExpression(e.getSpan(), "lib.Exception.__exc_pop");
            FunctionCallExpression pop_call = new FunctionCallExpression(e.getSpan());
            pop_call.setSource(pop);
            pop_call.insertArgument((Expression) handler.detach());
            SimpleStatement pop_statement = new SimpleStatement(e.getSpan());
            pop_statement.setExpression(pop_call);

            CompoundStatement try_block = new CompoundStatement(e.getSpan());
            // TODO will this cause trouble if we return from inside the block?
            try_block.insertStatement((CompoundStatement) as_try.getBody().detach());
            try_block.insertStatement((Statement) pop_statement.detach());
            if_statement.setBody(try_block);

            NameExpression recover = new NameExpression(e.getSpan(), "lib.Exception.recover");
            FunctionCallExpression recover_call = new FunctionCallExpression(e.getSpan());
            recover_call.setSource(recover);
            SimpleStatement recover_statement = new SimpleStatement(e.getSpan());
            recover_statement.setExpression(recover_call);

            CompoundStatement catch_block = new CompoundStatement(e.getSpan());
            catch_block.insertStatement((Statement) pop_statement.detach());
            catch_block.insertStatement(recover_statement);
            if_statement.setAlternative(catch_block);

            CompoundStatement block = new CompoundStatement(e.getSpan());
            block.insertStatement(handler_buf);
            block.insertStatement(if_statement);

            return block;
        } else {
            return e;
        }
    }
}
