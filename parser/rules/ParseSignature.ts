import { ASTElement } from "../../ast/ASTElement";
import { TokenElement } from "../../ast/TokenElement";
import { TypeExpressionElement } from "../../ast/TypeExpressionElement";
import { Token } from "../../lexer/Token";
import { TokenType } from "../../lexer/TokenType";
import { AssertEnd, AssertNegative, First, InOrder, MatchToken, Until } from "../Matcher";
import { ApplyPass, RuleList } from "../Parser";
import { ParseTypeExpression } from "./ParseTypeExpression";

export const ParseSignature: RuleList = {
    name: "ParseSignature",
    rules: [
        {
            name: "ExtractExpression",
            match: InOrder(
                AssertNegative((a: ASTElement[]) => {
                    if (a[0] instanceof TypeExpressionElement) return [true, 1];
                    return [false, 0];
                }),
                Until(First(MatchToken(TokenType.Comma), AssertEnd()))
            ),
            replace: (ast_stream: ASTElement[]) => {
                const [rc, changed] = ApplyPass(ast_stream, ParseTypeExpression);
                if (!changed) return undefined;
                return rc;
            }
        },
        {
            name: "DropCommas",
            match: InOrder(
                (a: ASTElement[]) => {
                    if (a[0] instanceof TypeExpressionElement) return [true, 1];
                    return [false, 0];
                },
                MatchToken(TokenType.Comma)
            ),
            replace: (ast_stream: [TypeExpressionElement, TokenElement<Token>]) => {
                return [ast_stream[0]];
            }
        }
    ]
};
