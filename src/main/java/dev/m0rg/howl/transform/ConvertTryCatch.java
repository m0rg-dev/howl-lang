package dev.m0rg.howl.transform;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.expression.ArithmeticExpression;
import dev.m0rg.howl.ast.expression.ClassCastExpression;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.expression.FunctionCallExpression;
import dev.m0rg.howl.ast.expression.NameExpression;
import dev.m0rg.howl.ast.expression.NumberExpression;
import dev.m0rg.howl.ast.expression.StringLiteral;
import dev.m0rg.howl.ast.statement.CatchStatement;
import dev.m0rg.howl.ast.statement.CompoundStatement;
import dev.m0rg.howl.ast.statement.IfStatement;
import dev.m0rg.howl.ast.statement.LocalDefinitionStatement;
import dev.m0rg.howl.ast.statement.SimpleStatement;
import dev.m0rg.howl.ast.statement.Statement;
import dev.m0rg.howl.ast.statement.ThrowStatement;
import dev.m0rg.howl.ast.statement.TryStatement;
import dev.m0rg.howl.ast.type.NumericType;
import dev.m0rg.howl.ast.type.RawPointerType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.logger.Logger;

public class ConvertTryCatch implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof TryStatement) {
            TryStatement as_try = (TryStatement) e;
            Logger.trace("ConvertTryCatch: " + as_try.formatForLog());

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
            // This is probably something we can handle once we have reachability analysis
            // (because it's kind of the same thing) but it will need to be handled
            try_block.insertStatement((CompoundStatement) as_try.getBody().detach());
            try_block.insertStatement((Statement) pop_statement.detach());
            if_statement.setBody(try_block);

            NameExpression recover = new NameExpression(e.getSpan(), "lib.Exception.recover");
            FunctionCallExpression recover_call = new FunctionCallExpression(e.getSpan());
            recover_call.setSource(recover);

            NameExpression exc_get = new NameExpression(e.getSpan(), "lib.Exception.exc_get");
            FunctionCallExpression exc_get_call = new FunctionCallExpression(e.getSpan());
            exc_get_call.setSource(exc_get);

            ThrowStatement a = new ThrowStatement(e.getSpan());
            a.isInternalRethrow = true;
            a.setSource(exc_get_call);
            Statement alternative = a;

            CompoundStatement catch_block = new CompoundStatement(e.getSpan());
            catch_block.insertStatement((Statement) pop_statement.detach());

            IfStatement chain = null;

            // we're building the if/else tree "inside out" so have to go in reverse
            List<CatchStatement> catch_blocks = new ArrayList<>(as_try.getAlternatives());
            Collections.reverse(catch_blocks);
            for (CatchStatement s : catch_blocks) {
                chain = generateCatchHandler(s);
                CompoundStatement else_block = new CompoundStatement(e.getSpan());
                else_block.insertStatement(alternative);
                chain.setAlternative(else_block);
                alternative = chain;
            }

            catch_block.insertStatement(chain);

            if_statement.setAlternative(catch_block);

            CompoundStatement block = new CompoundStatement(e.getSpan());
            block.insertStatement(handler_buf);
            block.insertStatement(if_statement);
            if_statement.originalTry = Optional.of(as_try);

            return block;
        } else {
            return e;
        }
    }

    IfStatement generateCatchHandler(CatchStatement block) {
        Span span = block.getSpan();
        IfStatement rc = new IfStatement(span);
        NameExpression exc_check = new NameExpression(span, "lib.Exception.exc_check");
        FunctionCallExpression check_call = new FunctionCallExpression(span);
        check_call.setSource(exc_check);
        StringLiteral name = new StringLiteral(span, "\"" + block.getType().format() + "\"");
        check_call.insertArgument(name);
        rc.setCondition(check_call);

        LocalDefinitionStatement exclocal = new LocalDefinitionStatement(span, block.getExcname());
        NameExpression exc_get = new NameExpression(span, "lib.Exception.exc_get");
        FunctionCallExpression get_call = new FunctionCallExpression(span);
        get_call.setSource(exc_get);
        exclocal.setLocaltype((TypeElement) block.getType().detach());
        ClassCastExpression cast = new ClassCastExpression(span);
        cast.setSource(get_call);
        cast.setTarget((TypeElement) block.getType().detach());
        exclocal.setInitializer(cast);

        CompoundStatement body = new CompoundStatement(span);
        rc.setBody(body);
        body.insertStatement(exclocal);
        body.insertStatement((Statement) block.getBody().detach());

        return rc;
    }
}
