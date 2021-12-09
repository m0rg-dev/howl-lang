package dev.m0rg.howl.lint;

import java.util.List;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Argument;
import dev.m0rg.howl.ast.Function;

public class ExternFunctionBaseTypesOnly extends LintPass {
    public void check(ASTElement e) {
        if (e instanceof Function) {
            Function as_function = (Function) e;
            if (as_function.isExtern()) {
                List<Argument> args = as_function.getArgumentList();
                for (Argument arg : args) {
                    if (!arg.getOwnType().resolve().isBase()) {
                        arg.getOwnType().getSpan().addError("extern functions may only accept base types");
                    }
                }
                if (!as_function.getReturn().resolve().isBase()) {
                    as_function.getSpan().addError("extern functions may only return base types");
                }
            }
        }
    }
}
