import { ASTElement } from "../../ast/ASTElement";
import { ConstructorCallExpression } from "../../ast/expression/ConstructorCallExpression";
import { FFICallExpression } from "../../ast/expression/FFICallExpression";
import { FieldReferenceExpression } from "../../ast/expression/FieldReferenceExpression";
import { FunctionCallExpression } from "../../ast/expression/FunctionCallExpression";
import { IndexExpression } from "../../ast/expression/IndexExpression";
import { NameExpression } from "../../ast/expression/NameExpression";
import { NumberExpression } from "../../ast/expression/NumberExpression";
import { ExpressionElement } from "../../ast/ExpressionElement";
import { NameElement } from "../../ast/NameElement";
import { SyntaxErrorElement } from "../../ast/SyntaxErrorElement";
import { TokenElement } from "../../ast/TokenElement";
import { TypeElement } from "../../ast/TypeElement";
import { NumericLiteralToken } from "../../lexer/NumericLiteralToken";
import { Token } from "../../lexer/Token";
import { TokenType } from "../../lexer/TokenType";
import { StructureType } from "../../type_inference/StructureType";
import { InOrder, MatchElementType, MatchToken, Optional, Star } from "../Matcher";
import { LocationFrom, RuleList } from "../Parser";
import { MatchExpression, MatchType } from "./MatchUtils";

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
            name: "Index",
            match: InOrder(
                MatchExpression(),
                MatchToken(TokenType.OpenBracket),
                MatchExpression(),
                MatchToken(TokenType.CloseBracket)
            ),
            replace: (ast_stream: [ExpressionElement, TokenElement<any>, ExpressionElement]) => {
                return [new IndexExpression(LocationFrom(ast_stream), ast_stream[0], ast_stream[2])];
            }
        },
        {
            name: "ConstructorCall",
            match: InOrder(
                MatchToken(TokenType.New),
                MatchType(),
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
            name: "FFICall",
            match: InOrder(
                MatchToken(TokenType.FFICall),
                MatchElementType("NameExpression"),
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
            replace: (ast_stream: [TokenElement<any>, NameExpression, ...ASTElement[]]) => {
                const source = ast_stream[1];
                const rest = ast_stream.slice(3, -1);
                const args: ExpressionElement[] = [];
                rest.forEach(x => {
                    if (x instanceof ExpressionElement) {
                        args.push(x);
                    }
                });
                return [new FFICallExpression(LocationFrom(ast_stream), source.name, args)];
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
