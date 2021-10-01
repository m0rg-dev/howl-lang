import { ASTElement, SourceLocation } from "../ast/ASTElement";
import { TokenType } from "../lexer/TokenType";
import { Any, AssertNegative, First, InOrder, Matcher, MatchToken, Star } from "./Matcher";

export function LocationFrom(ast_stream: ASTElement[]): SourceLocation {
    if (!ast_stream.length) return [0, 0];
    return [ast_stream[0].source_location[0], ast_stream[ast_stream.length - 1].source_location[1]];
}

export type ProductionRule = {
    name: string;
    match: Matcher;
    replace: (ast_stream: ASTElement[]) => ASTElement[];
    startOnly?: boolean;
};

export type RuleList = {
    name: string;
    rules: ProductionRule[];
};

export const ResynchronizeTopLevel: Matcher = InOrder(
    Star(InOrder(AssertNegative(
        First(
            MatchToken(TokenType.Class),
            MatchToken(TokenType.Function),
            MatchToken(TokenType.Static),
        )
    ), Any()))
);
