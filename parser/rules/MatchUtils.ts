import { ASTElement } from "../../ast/ASTElement";
import { ExpressionElement } from "../../ast/ExpressionElement";
import { SimpleTypeElement, TypeElement } from "../../ast/TypeElement";
import { TokenType } from "../../lexer/TokenType";
import { AssertNegative, InOrder, MatchElementType, Matcher, MatchToken, Optional, Star } from "../Matcher";

export function MatchExpression(): Matcher {
    return (ast_stream: ASTElement[]) => {
        if (ast_stream[0] instanceof ExpressionElement) return [true, 1];
        return [false, 0];
    }
}

export function MatchSingleType(): Matcher {
    return (ast_stream: ASTElement[]) => {
        if (ast_stream[0] instanceof SimpleTypeElement) return [true, 1];
        return [false, 0];
    }
}

export function MatchType(): Matcher {
    return (ast_stream: ASTElement[]) => {
        if (ast_stream[0] instanceof TypeElement) return [true, 1];
        return [false, 0];
    }
}