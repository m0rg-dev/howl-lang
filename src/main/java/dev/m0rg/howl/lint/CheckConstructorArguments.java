package dev.m0rg.howl.lint;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Argument;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.expression.ConstructorCallExpression;
import dev.m0rg.howl.ast.type.ObjectReferenceType;
import dev.m0rg.howl.logger.Logger;

public class CheckConstructorArguments extends LintPass {
    public void check(ASTElement e) {
        if (e instanceof ConstructorCallExpression
                && ((ConstructorCallExpression) e).getResolvedType() instanceof ObjectReferenceType) {
            ObjectReferenceType source = (ObjectReferenceType) ((ConstructorCallExpression) e).getResolvedType();
            Logger.trace("CheckConstructorArguments " + e.format());
            if (source.getSource().getConstructor().isPresent()) {
                Function c = source.getSource().getConstructor().get();
                int n_constructor_arguments = c.getArgumentList().size() - 1;
                int n_provided_arguments = ((ConstructorCallExpression) e).getArguments().size();
                if (c.getArgumentList().size() - 1 != ((ConstructorCallExpression) e).getArguments().size()) {
                    e.getSpan().addError(
                            ((n_constructor_arguments > n_provided_arguments) ? "Too few"
                                    : "Too many") +
                                    " arguments for constructor",
                            "Constructor arguments: ("
                                    + Argument.formatList(c.getArgumentList().subList(1, c.getArgumentList().size()))
                                    + ")");
                }
            }
        }
    }
}
