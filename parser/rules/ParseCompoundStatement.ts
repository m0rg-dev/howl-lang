import { ASTElement } from "../../ast/ASTElement";
import { CompoundStatementElement } from "../../ast/CompoundStatementElement";
import { ExpressionElement } from "../../ast/ExpressionElement";
import { IfStatement } from "../../ast/statement/IfStatement";
import { WhileStatement } from "../../ast/statement/WhileStatement";
import { PartialStatementElement, StatementElement } from "../../ast/StatementElement";
import { TokenElement } from "../../ast/TokenElement";
import { TokenType } from "../../lexer/TokenType";
import { AssertNegative, First, Hug, InOrder, MatchElementType, Matcher, MatchToken, Until } from "../Matcher";
import { ApplyPass, LocationFrom, Parse, RuleList } from "../Parser";
import { MatchExpression } from "./MatchUtils";
import { ConvertNamesExpression, ParseExpression } from "./ParseExpression";
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
            name: "ExtractConditionalExpression",
            match: InOrder(
                First(
                    MatchToken(TokenType.If),
                    MatchToken(TokenType.While)
                ),
                Hug(TokenType.OpenParen)
            ),
            replace: (ast_stream: ASTElement[]) => {
                const rest = ast_stream.slice(2, -1);
                const parsed0 = ApplyPass(rest, ConvertNamesExpression)[0];
                const parsed1 = ApplyPass(parsed0, ParseExpression)[0];
                return [ast_stream[0], ...parsed1];
            }
        },
        {
            name: "IfStatement",
            match: InOrder(
                MatchToken(TokenType.If),
                MatchExpression(),
                Hug(TokenType.OpenBrace)
            ),
            replace: (ast_stream: [TokenElement<any>, ExpressionElement, ...ASTElement[]]) => {
                const rest = ast_stream.slice(2);
                const parsed = ApplyPass(rest, ParseCompoundStatement)[0];
                return [new IfStatement(LocationFrom(ast_stream), ast_stream[1], new CompoundStatementElement(LocationFrom(parsed), parsed, undefined))];
            }
        },
        {
            name: "WhileStatement",
            match: InOrder(
                MatchToken(TokenType.While),
                MatchExpression(),
                Hug(TokenType.OpenBrace)
            ),
            replace: (ast_stream: [TokenElement<any>, ExpressionElement, ...ASTElement[]]) => {
                const rest = ast_stream.slice(2);
                const parsed = ApplyPass(rest, ParseCompoundStatement)[0];
                return [new WhileStatement(LocationFrom(ast_stream), ast_stream[1], new CompoundStatementElement(LocationFrom(parsed), parsed, undefined))];
            }
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
                parsed = ApplyPass(parsed, ConvertNamesExpression)[0];
                parsed = ApplyPass(parsed, ParseStatement)[0];
                return parsed;
            }
        }
    ]
};
