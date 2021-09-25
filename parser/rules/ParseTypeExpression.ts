import { TokenElement } from "../../ast/TokenElement";
import { TypeElement } from "../../ast/TypeElement";
import { TypeIndexElement, TypeLiteralElement } from "../../ast/TypeExpressionElement";
import { NumericLiteralToken } from "../../lexer/NumericLiteralToken";
import { Token } from "../../lexer/Token";
import { TokenType } from "../../lexer/TokenType";
import { InOrder, MatchElementType, MatchToken } from "../Matcher";
import { LocationFrom, RuleList } from "../Parser";
import { MatchType } from "./MatchUtils";

export const ParseTypeExpression: RuleList = {
    name: "ParseTypeExpression",
    rules: [
        {
            name: "ConvertLiterals",
            match: MatchType(),
            replace: (ast_stream: [TypeElement]) => {
                return [new TypeLiteralElement(ast_stream[0].source_location, ast_stream[0].name)];
            }
        },
        {
            name: "Index",
            match: InOrder(
                MatchToken(TokenType.NumericLiteral),
                MatchToken(TokenType.OpenBracket),
                MatchToken(TokenType.NumericLiteral),
                MatchToken(TokenType.CloseBracket)
            ),
            replace: (ast_stream: [TokenElement<NumericLiteralToken>, TokenElement<Token>, TokenElement<NumericLiteralToken>, TokenElement<Token>]) => {
                return [
                    new TypeIndexElement(LocationFrom(ast_stream), ast_stream[0].token.value, ast_stream[2].token.value)
                ];
            }
        }
    ]
};
