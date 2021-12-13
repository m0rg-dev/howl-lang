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
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.logger.Logger;

public class CheckExceptions extends LintPass {
    public void check(ASTElement e) {
        if (e instanceof FunctionCallExpression) {
            FunctionCallExpression call = (FunctionCallExpression) e;
            if (call.isGeneratedFromThrow) {
                if (((TypeElement) NamedType.build(e.getSpan(), "root.lib.UncheckedException")
                        .setParent(e.getParent())).resolve().accepts(call.getArguments().get(0).getResolvedType())) {
                    // we don't have to check it!
                    return;
                }

                if (getContainingTry(e, call.getArguments().get(0).getResolvedType()).isPresent()) {
                    // it's caught in a catch block
                    return;
                }

                List<String> allowed_types = new ArrayList<>();
                for (TypeElement th : call.getContainingFunction().getThrows()) {
                    Logger.trace(
                            "throw " + call.getArguments().get(0).getResolvedType().format() + " -> "
                                    + th.resolve().format());
                    if (th.resolve().accepts(call.getArguments().get(0).getResolvedType())) {
                        // it was declared!
                        return;
                    }
                    allowed_types.add(th.resolve().format());
                }
                if (allowed_types.isEmpty()) {
                    allowed_types.add("<no types>");
                }
                e.getSpan().addError("Uncaught exception type " + call.getArguments().get(0).getResolvedType().format(),
                        "declared types:\n" + String.join("\n", allowed_types).indent(2));
            }
        }
    }

    static Optional<ASTElement> getContainingTry(ASTElement source, TypeElement exctype) {
        ASTElement p = source;
        while (!(p instanceof Function)) {
            if (p instanceof IfStatement && ((IfStatement) p).originalTry.isPresent()) {
                TryStatement orig = ((IfStatement) p).originalTry.get();
                for (CatchStatement c : orig.getAlternatives()) {
                    if (c.getType().resolve().accepts(exctype)) {
                        return Optional.of(p);
                    }
                }
            }
            p = p.getParent();
        }
        return Optional.empty();
    }
}
