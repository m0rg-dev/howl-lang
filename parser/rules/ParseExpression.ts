import { ASTElement } from "../../ast/ASTElement";
import { ArithmeticExpression } from "../../ast/expression/ArithmeticExpression";
import { ComparisonExpression } from "../../ast/expression/ComparisonExpression";
import { ConstructorCallExpression } from "../../ast/expression/ConstructorCallExpression";
import { FFICallExpression } from "../../ast/expression/FFICallExpression";
import { FieldReferenceExpression } from "../../ast/expression/FieldReferenceExpression";
import { FunctionCallExpression } from "../../ast/expression/FunctionCallExpression";
import { IndexExpression } from "../../ast/expression/IndexExpression";
import { NameExpression } from "../../ast/expression/NameExpression";
import { NumberExpression } from "../../ast/expression/NumberExpression";
import { StringConstantExpression } from "../../ast/expression/StringConstantExpression";
import { TypeExpression } from "../../ast/expression/TypeExpression";
import { ExpressionElement } from "../../ast/ExpressionElement";
import { NameElement } from "../../ast/NameElement";
import { SyntaxErrorElement } from "../../ast/SyntaxErrorElement";
import { TokenElement } from "../../ast/TokenElement";
import { TypeElement } from "../../ast/TypeElement";
import { NumericLiteralToken } from "../../lexer/NumericLiteralToken";
import { StringLiteralToken } from "../../lexer/StringLiteralToken";
import { Token } from "../../lexer/Token";
import { TokenType } from "../../lexer/TokenType";
import { StructureType } from "../../type_inference/StructureType";
import { AssertEnd, InOrder, MatchElementType, MatchToken, Optional, Star } from "../Matcher";
import { LocationFrom, ProductionRule, RuleList } from "../Parser";
import { MatchExpression, MatchType } from "./MatchUtils";

export const ConvertNamesExpression: RuleList = {
    name: "ConvertNamesExpression",
    rules: [
        {
            name: "ConvertNames",
            match: MatchElementType("NameElement"),
            replace: (ast_stream: [NameElement]) => [new NameExpression(LocationFrom(ast_stream), ast_stream[0].name)]
        },
        {
            name: "ConvertTypeLiterals",
            match: MatchType(),
            replace: (ast_stream: [TypeElement]) => [new TypeExpression(LocationFrom(ast_stream), ast_stream[0].asTypeObject())]
        }
    ]
}

function Arithmetic(name: string, op: string, ...tokens: TokenType[]): ProductionRule {
    return {
        name: name,
        match: InOrder(
            MatchExpression(),
            ...tokens.map(x => MatchToken(x)),
            MatchExpression(),
        ),
        replace: (ast_stream: [ExpressionElement, TokenElement<any>, ExpressionElement]) => {
            return [new ArithmeticExpression(LocationFrom(ast_stream), ast_stream[0], ast_stream[2], op)];
        },
    };
}

function Comparison(name: string, op: string, ...tokens: TokenType[]): ProductionRule {
    return {
        name: name,
        match: InOrder(
            MatchExpression(),
            ...tokens.map(x => MatchToken(x)),
            MatchExpression(),
            AssertEnd()
        ),
        replace: (ast_stream: [ExpressionElement, TokenElement<any>, ExpressionElement]) => {
            return [new ComparisonExpression(LocationFrom(ast_stream), ast_stream[0], ast_stream[2], op)];
        },
        startOnly: true
    };
}

export const ParseExpression: RuleList = {
    name: "ParseExpression",
    rules: [
        {
            name: "ConvertNumbers",
            match: MatchToken(TokenType.NumericLiteral),
            replace: (ast_stream: [TokenElement<NumericLiteralToken>]) => [new NumberExpression(LocationFrom(ast_stream), ast_stream[0].token.value)]
        },
        {
            name: "ConvertStringConstants",
            match: MatchToken(TokenType.StringLiteral),
            replace: (ast_stream: [TokenElement<StringLiteralToken>]) => [new StringConstantExpression(LocationFrom(ast_stream), ast_stream[0].token.str)]
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
                MatchElementType("TypeExpression"),
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
            replace: (ast_stream: [TokenElement<any>, TypeExpression, ...ASTElement[]]) => {
                const rest = ast_stream.slice(3, -1);
                const args: ExpressionElement[] = [];
                rest.forEach(x => {
                    if (x instanceof ExpressionElement) {
                        args.push(x);
                    }
                });
                const source_type = ast_stream[1].source;
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
        },
        Arithmetic("Multiply", "*", TokenType.Asterisk),
        Arithmetic("Add", "+", TokenType.Plus),
        Comparison("GreaterThan", ">", TokenType.CloseAngle),
        Comparison("LessThan", "<", TokenType.OpenAngle),
    ]
};
