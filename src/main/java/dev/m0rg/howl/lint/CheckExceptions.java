package dev.m0rg.howl.lint;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.expression.FunctionCallExpression;
import dev.m0rg.howl.ast.statement.CatchStatement;
import dev.m0rg.howl.ast.statement.IfStatement;
import dev.m0rg.howl.ast.statement.TryStatement;
import dev.m0rg.howl.ast.type.ClassType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.ast.type.algebraic.ACallResult;
import dev.m0rg.howl.ast.type.algebraic.AFunctionReference;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AOverloadType;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.ast.type.algebraic.AVariable;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;
import dev.m0rg.howl.logger.Logger;

public class CheckExceptions extends LintPass {
    public void check(ASTElement e) {
        if (e instanceof FunctionCallExpression) {
            FunctionCallExpression call = (FunctionCallExpression) e;
            List<ALambdaTerm> thrown_types = new ArrayList<>();

            if (call.isGeneratedFromThrow) {
                AVariable.reset();
                ALambdaTerm exctype = ALambdaTerm.evaluateFrom(call.getArguments().get(0));
                thrown_types.add(exctype);
            } else {
                ALambdaTerm ftype = ALambdaTerm.evaluateFrom(call.getSource());
                if (ftype instanceof AOverloadType) {
                    AOverloadType as_overload = (AOverloadType) ftype;
                    AFunctionReference source = as_overload
                            .getFunction(((ACallResult) AlgebraicType.derive(call)).getArguments().stream()
                                    .map(x -> ALambdaTerm.evaluate(x)).toList());
                    thrown_types = source.getSource().getThrows().stream()
                            .map(x -> ALambdaTerm.evaluateFrom(x)).toList();
                } else if (ftype instanceof AFunctionReference) {
                    thrown_types = ((AFunctionReference) ftype).getSource().getThrows().stream()
                            .map(x -> ALambdaTerm.evaluateFrom(x)).toList();
                }
            }

            for (ALambdaTerm exctype : thrown_types) {
                if (new AStructureReference(
                        (ClassType) new ClassType(e.getSpan(), "root.lib.UncheckedException").setParent(e.getParent()))
                                .accepts(exctype)) {
                    // we don't have to check it!
                    return;
                }

                if (getContainingTry(e, exctype).isPresent()) {
                    // it's caught in a catch block
                    return;
                }

                List<String> allowed_types = new ArrayList<>();
                for (TypeElement th : call.getContainingFunction().getThrows()) {
                    ALambdaTerm thtype = ALambdaTerm.evaluate(AlgebraicType.derive(th));
                    Logger.trace(
                            "throw " + exctype.format() + " -> "
                                    + thtype.format());
                    if (thtype.accepts(exctype)) {
                        // it was declared!
                        return;
                    }
                    allowed_types.add(th.resolve().format());
                }
                if (allowed_types.isEmpty()) {
                    allowed_types.add("<no types>");
                }
                e.getSpan().addError("Uncaught exception type " + exctype.format(),
                        "declared types:\n" + String.join("\n", allowed_types).indent(2));
            }
        }
    }

    static Optional<ASTElement> getContainingTry(ASTElement source, ALambdaTerm exctype) {
        ASTElement p = source;
        while (!(p instanceof Function)) {
            if (p instanceof IfStatement && ((IfStatement) p).originalTry.isPresent()) {
                TryStatement orig = ((IfStatement) p).originalTry.get();
                for (CatchStatement c : orig.getAlternatives()) {
                    if (AlgebraicType.derive(c.getType()).accepts(exctype)) {
                        return Optional.of(p);
                    }
                }
            }
            p = p.getParent();
        }
        return Optional.empty();
    }
}
