package dev.m0rg.howl.transform;

import java.util.Map.Entry;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.HasUpstreamFields;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;
import dev.m0rg.howl.logger.Logger;

public class EnsureTypesResolve implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof Expression) {
            boolean noisy = ((Expression) e).nearestStatement().getAnnotations().getOrDefault("debug", "")
                    .contains("dumptypes");
            if (noisy) {
                Logger.trace("EnsureTypesResolve: dumptypes \u001b[1m" + e.formatForLog() + "\u001b[0m ("
                        + e.getClass().getSimpleName() + ")");
                if (e instanceof HasUpstreamFields) {
                    HasUpstreamFields as_upstream = (HasUpstreamFields) e;
                    if (as_upstream.getUpstreamFields().size() > 0) {
                        Logger.trace("- This expression has upstream fields:");
                        Logger.trace(String.format("%15s │ %s", "field", "types"));
                        Logger.trace("────────────────┼──────────────────────");
                        for (Entry<String, FieldHandle> f : as_upstream.getUpstreamFields().entrySet()) {
                            Logger.trace(
                                    String.format("%15s │ expected:  %s", f.getKey(),
                                            f.getValue().getExpectedType().format()
                                                    + " -> "
                                                    + ALambdaTerm.evaluate(f.getValue().getExpectedType()).format()));
                            Logger.trace(
                                    String.format("%15s │ provided:  %s", "",
                                            AlgebraicType.derive(f.getValue().getSubexpression()).format()
                                                    + " -> "
                                                    + ALambdaTerm
                                                            .evaluate(AlgebraicType
                                                                    .derive(f.getValue().getSubexpression()))
                                                            .format()));
                        }

                        Logger.trace("- And here are evaluation traces for those fields:");
                        for (Entry<String, FieldHandle> f : as_upstream.getUpstreamFields().entrySet()) {
                            Logger.trace("  - " + f.getKey() + " (expected)");
                            ALambdaTerm ty = ALambdaTerm.evaluate(f.getValue().getExpectedType(), true);
                        }
                        Logger.trace("");
                    }
                }

                if (e.getParent() instanceof HasUpstreamFields) {
                    Logger.trace("- This expression is an upstream field:");
                    HasUpstreamFields as_upstream = (HasUpstreamFields) e.getParent();
                    for (Entry<String, FieldHandle> f : as_upstream.getUpstreamFields().entrySet()) {
                        if (f.getValue().getSubexpression() == e) {
                            Logger.trace(
                                    String.format("%15s │ %s", f.getKey(), f.getValue().getExpectedType().format()
                                            + " = " + ALambdaTerm.evaluate(f.getValue().getExpectedType()).format()));
                        }
                    }

                }
                Logger.trace("");
                Logger.trace("╭╴ evaluation trace begins here ╶╮");
            }
            ALambdaTerm ty = ALambdaTerm.evaluateFrom(e, noisy);
            if (noisy) {
                Logger.trace("╰╴  evaluation trace ends here  ╶╯");
                Logger.trace("evaluation result was: " + ty.format());
                Logger.trace("");
            }
            if (ty.freeVariables().size() > 0) {
                e.getSpan().addError("Unable to resolve type for expression", ty.format());
            }
        }
        return e;
    }
}
