import { ASTElement } from "../../ast/ASTElement";
import { ExpressionElement } from "../../ast/ExpressionElement";
import { SimpleTypeElement } from "../../ast/TypeElement";
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

export function Defer(m: () => Matcher): Matcher {
    return (ast_stream: ASTElement[]) => {
        return m()(ast_stream);
    }
}
