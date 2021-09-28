import { ASTElement } from "../../ast/ASTElement";
import { PartialStatementElement, StatementElement } from "../../ast/StatementElement";
import { TokenType } from "../../lexer/TokenType";
import { AssertNegative, Hug, InOrder, MatchElementType, Matcher, MatchToken, Until } from "../Matcher";
import { ApplyPass, LocationFrom, Parse, RuleList } from "../Parser";
import { ParseStatement } from "./ParseStatement";
import { ParseTypes } from "./ParseType";

export function MatchStatement(): Matcher {
    return (ast_stream: ASTElement[]) => {
        if (ast_stream[0] instanceof StatementElement) return [true, 1];
        return [false, 0];
    }
}

export const ParseCompoundStatement: RuleList = {
    name: "ParseCompoundStatement",
    rules: [
        {
            name: "DropBraces",
            match: InOrder(
                Hug(TokenType.OpenBrace)
            ),
            replace: (ast_stream: [...ASTElement[]]) => {
                return ast_stream.slice(1, -1);
            },
            startOnly: true
        },
        {
            name: "ExtractSimpleStatement",
            match: InOrder(
                AssertNegative(MatchStatement()),
                Until(MatchToken(TokenType.Semicolon)),
                MatchToken(TokenType.Semicolon)
            ),
            replace: (ast_stream: ASTElement[]) => {
                let rest = ast_stream.slice(0, -1);
                return [new PartialStatementElement(LocationFrom(ast_stream), rest)];
            }
        },
        {
            name: "ParseStatement",
            match: MatchElementType("PartialStatementElement"),
            replace: (ast_stream: [PartialStatementElement]) => {
                let parsed = ApplyPass(ast_stream[0].body, ParseTypes)[0];
                parsed = ApplyPass(ast_stream[0].body, ParseStatement)[0];
                return parsed;
            }
        }
    ]
};
