import { ASTElement } from "../../ast/ASTElement";
import { SignatureElement } from "../../ast/SignatureElement";
import { PartialStatementElement, StatementElement } from "../../ast/StatementElement";
import { TokenType } from "../../lexer/TokenType";
import { AssertNegative, Hug, InOrder, MatchElementType, Matcher, MatchToken, Until } from "../Matcher";
import { ApplyPass, LocationFrom, RuleList } from "../Parser";
import { ParseSignature } from "./ParseSignature";
import { ParseStatement } from "./ParseStatement";

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
            name: "CreateSignature",
            match: Hug(TokenType.OpenAngle),
            replace: (ast_stream: ASTElement[]) => {
                let changed: boolean;
                [ast_stream, changed] = ApplyPass(ast_stream.slice(1, -1), ParseSignature);
                return [new SignatureElement(LocationFrom(ast_stream), ast_stream)];
            },
            startOnly: true
        },
        {
            name: "DropBraces",
            match: InOrder(
                MatchElementType("SignatureElement"),
                Hug(TokenType.OpenBrace)
            ),
            replace: (ast_stream: [SignatureElement, ...ASTElement[]]) => {
                return [ast_stream[0], ...ast_stream.slice(2, -1)];
            },
            startOnly: true
        },
        {
            name: "ExtractSimpleStatement",
            match: InOrder(
                AssertNegative(MatchElementType("SignatureElement")),
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
                const parsed = ApplyPass(ast_stream[0].body, ParseStatement)[0];
                return parsed;
            }
        }
    ]
};
