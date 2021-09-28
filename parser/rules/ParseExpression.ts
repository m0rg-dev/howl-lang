import { ASTElement } from "../../ast/ASTElement";
import { ExpressionElement } from "../../ast/ExpressionElement";
import { ConstructorCallExpression } from "../../ast/expression/ConstructorCallExpression";
import { FunctionCallExpression } from "../../ast/expression/FunctionCallExpression";
import { FieldReferenceExpression } from "../../ast/expression/FieldReferenceExpression";
import { NumberExpression } from "../../ast/expression/NumberExpression";
import { NameExpression } from "../../ast/expression/NameExpression";
import { NameElement } from "../../ast/NameElement";
import { SyntaxErrorElement } from "../../ast/SyntaxErrorElement";
import { TokenElement } from "../../ast/TokenElement";
import { SimpleTypeElement, TypeElement } from "../../ast/TypeElement";
import { NumericLiteralToken } from "../../lexer/NumericLiteralToken";
import { Token } from "../../lexer/Token";
import { TokenType } from "../../lexer/TokenType";
import { InOrder, MatchElementType, Matcher, MatchToken, Optional, Star } from "../Matcher";
import { LocationFrom, RuleList } from "../Parser";
import { MatchExpression } from "./MatchUtils";
import { StructureType } from "../../type_inference/StructureType";
import { ParseTypes } from "./ParseType";

export const ParseExpression: RuleList = {
    name: "ParseExpression",
    rules: [
        {
            name: "ConvertNames",
            match: MatchElementType("NameElement"),
            replace: (ast_stream: [NameElement]) => [new NameExpression(LocationFrom(ast_stream), ast_stream[0].name)]
        },
        {
            name: "ConvertNumbers",
            match: MatchToken(TokenType.NumericLiteral),
            replace: (ast_stream: [TokenElement<NumericLiteralToken>]) => [new NumberExpression(LocationFrom(ast_stream), ast_stream[0].token.value)]
        },
        {
            name: "FieldReference",
            match: InOrder(
                MatchExpression(),
                MatchToken(TokenType.Period),
                MatchElementType("NameExpression")
            ),
            replace: (ast_stream: [ExpressionElement, TokenElement<Token>, NameExpression]) => {
                return [new FieldReferenceExpression(LocationFrom(ast_stream), ast_stream[0], ast_stream[2].name)];
            }
        },
        {
            name: "ConstructorCall",
            match: InOrder(
                MatchToken(TokenType.New),
                MatchElementType("TypeElement"),
                MatchToken(TokenType.OpenParen),
                Optional(
                    InOrder(
                        MatchExpression(),
                        Star(
                            InOrder(
                                MatchToken(TokenType.Comma),
                                MatchExpression()
                            )
                        )
                    )
                ),
                MatchToken(TokenType.CloseParen)
            ),
            replace: (ast_stream: [TokenElement<any>, TypeElement, ...ASTElement[]]) => {
                const rest = ast_stream.slice(3, -1);
                const args: ExpressionElement[] = [];
                rest.forEach(x => {
                    if (x instanceof ExpressionElement) {
                        args.push(x);
                    }
                });
                const source_type = ast_stream[1].asTypeObject();
                if (!(source_type instanceof StructureType)) return [new SyntaxErrorElement(LocationFrom(ast_stream), `Attempted to construct non-class ${ast_stream[1]}`)];
                return [new ConstructorCallExpression(LocationFrom(ast_stream), source_type, args)];
            }
        },
        {
            name: "FunctionCall",
            match: InOrder(
                MatchExpression(),
                MatchToken(TokenType.OpenParen),
                Optional(
                    InOrder(
                        MatchExpression(),
                        Star(
                            InOrder(
                                MatchToken(TokenType.Comma),
                                MatchExpression()
                            )
                        )
                    )
                ),
                MatchToken(TokenType.CloseParen)
            ),
            replace: (ast_stream: [ExpressionElement, ...ASTElement[]]) => {
                const source = ast_stream[0];
                const rest = ast_stream.slice(2, -1);
                const args: ExpressionElement[] = [];
                rest.forEach(x => {
                    if (x instanceof ExpressionElement) {
                        args.push(x);
                    }
                });
                return [new FunctionCallExpression(LocationFrom(ast_stream), source, args)];
            }
        }
    ]
};
