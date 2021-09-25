import { ASTElement } from "../../ast/ASTElement";
import { ExpressionElement } from "../../ast/ExpressionElement";
import { TypeElement } from "../../ast/TypeElement";
import { Matcher } from "../Matcher";

export function MatchExpression(): Matcher {
    return (ast_stream: ASTElement[]) => {
        if (ast_stream[0] instanceof ExpressionElement) return [true, 1];
        return [false, 0];
    }
}

export function MatchType(): Matcher {
    return (ast_stream: ASTElement[]) => {
        if (ast_stream[0] instanceof TypeElement) return [true, 1];
        return [false, 0];
    }
}