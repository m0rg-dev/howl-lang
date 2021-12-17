package dev.m0rg.howl.lint;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.ObjectCommon;
import dev.m0rg.howl.ast.expression.FieldReferenceExpression;
import dev.m0rg.howl.ast.expression.FunctionCallExpression;
import dev.m0rg.howl.ast.expression.SuperCastExpression;
import dev.m0rg.howl.ast.statement.SimpleStatement;

public class SuperConstructorCalls extends LintPass {
    public void check(ASTElement e) {
        if (e instanceof Function) {
            Function as_func = (Function) e;
            if (as_func.getOriginalName().equals("constructor")) {
                ObjectCommon owner = as_func.nearestObject().get();
                if (owner.getExtends().isPresent()) {
                    ObjectCommon parent = (ObjectCommon) owner.resolveName(owner.getExtends().get().getName()).get();
                    if (parent.getOverloadCandidates("constructor").size() > 0) {
                        if (!(as_func.getBody().get().getContents().get(0) instanceof SimpleStatement)) {
                            complain(e);
                            return;
                        }

                        SimpleStatement first_statement = (SimpleStatement) as_func.getBody().get().getContents()
                                .get(0);
                        if (!(first_statement.getExpression() instanceof FunctionCallExpression)) {
                            complain(e);
                            return;
                        }

                        FunctionCallExpression call = (FunctionCallExpression) first_statement.getExpression();
                        if (!(call.getSource() instanceof FieldReferenceExpression)) {
                            complain(e);
                            return;
                        }

                        FieldReferenceExpression ref = (FieldReferenceExpression) call.getSource();
                        if (!(ref.getSource() instanceof SuperCastExpression)) {
                            complain(e);
                            return;
                        }

                        if (!ref.getName().equals("constructor")) {
                            complain(e);
                            return;
                        }
                    }
                }
            }
        }
    }

    void complain(ASTElement e) {
        e.getSpan().addError("constructor of subclass does not start with super.constructor() call");
    }
}
