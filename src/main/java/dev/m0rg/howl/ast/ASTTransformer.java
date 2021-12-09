package dev.m0rg.howl.ast;

import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.statement.CompoundStatement;
import dev.m0rg.howl.ast.statement.Statement;
import dev.m0rg.howl.ast.type.TypeElement;

public interface ASTTransformer {
    default Expression transform(Expression element) {
        ASTElement rc = this.transform((ASTElement) element);
        if (rc instanceof Expression) {
            return (Expression) rc;
        } else {
            throw new RuntimeException("Attempted to replace Expression with " + rc.getClass().getName());
        }
    }

    default CompoundStatement transform(CompoundStatement element) {
        ASTElement rc = this.transform((ASTElement) element);
        if (rc instanceof CompoundStatement) {
            return (CompoundStatement) rc;
        } else {
            throw new RuntimeException("Attempted to replace CompoundStatement with " + rc.getClass().getName());
        }
    }

    default TypeElement transform(TypeElement element) {
        ASTElement rc = this.transform((ASTElement) element);
        if (rc instanceof TypeElement) {
            return (TypeElement) rc;
        } else {
            throw new RuntimeException("Attempted to replace TypeElement with " + rc.getClass().getName());
        }
    }

    default Function transform(Function element) {
        ASTElement rc = this.transform((ASTElement) element);
        if (rc instanceof Function) {
            return (Function) rc;
        } else {
            throw new RuntimeException("Attempted to replace Function with " + rc.getClass().getName());
        }
    }

    default Statement transform(Statement element) {
        ASTElement rc = this.transform((ASTElement) element);
        if (rc instanceof Statement) {
            return (Statement) rc;
        } else {
            throw new RuntimeException("Attempted to replace Statement with " + rc.getClass().getName());
        }
    }

    default ASTElement transform(ASTElement element) {
        return element;
    }
}
