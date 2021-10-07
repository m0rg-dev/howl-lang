import { ASTElement } from "../ast/ASTElement";
import { ArithmeticExpression } from "../ast/expression/ArithmeticExpression";
import { ComparisonExpression } from "../ast/expression/ComparisonExpression";
import { ConstructorCallExpression } from "../ast/expression/ConstructorCallExpression";
import { FFICallExpression } from "../ast/expression/FFICallExpression";
import { FieldReferenceExpression } from "../ast/expression/FieldReferenceExpression";
import { FunctionCallExpression } from '../ast/expression/FunctionCallExpression';
import { IndexExpression } from "../ast/expression/IndexExpression";
import { NameExpression } from "../ast/expression/NameExpression";
import { NumberExpression } from "../ast/expression/NumberExpression";
import { StringConstantExpression } from "../ast/expression/StringConstantExpression";
import { ExpressionElement } from "../ast/ExpressionElement";
import { TokenElement } from "../ast/TokenElement";
import { TypeElement } from "../ast/TypeElement";
import { NameToken } from "../lexer/NameToken";
import { NumericLiteralToken } from "../lexer/NumericLiteralToken";
import { StringLiteralToken } from "../lexer/StringLiteralToken";
import { TokenType } from "../lexer/TokenType";
import { Hug, InOrder, MatchElementType, MatchToken } from "../parser/Matcher";
import { MatchExpression } from "../parser/MatchUtils";
import { LocationFrom, ProductionRule } from "../parser/Parser";
import { CompilationUnit } from "./CompilationUnit";
import { Errors } from "./Errors";
import { Pass } from "./Pass";

export class ExpressionPass extends Pass {
    ApplyRecDescent(segment: ASTElement[]) {
        let rc = false;
        do {
            rc = false;

            rc = this.ApplySingleProductionRule({
                name: "FieldReference",
                match: InOrder(MatchExpression(), MatchToken(TokenType.Period), MatchElementType("NameExpression")),
                replace: (ast_stream: [ExpressionElement, any, NameExpression]) => {
                    return [new FieldReferenceExpression(LocationFrom(ast_stream), ast_stream[0], ast_stream[2].name)]
                }
            }, segment) || rc;
            // TODO
            if (rc) continue;

            rc = this.ApplySingleProductionRule({
                name: "FunctionApplication",
                match: InOrder(MatchExpression(), Hug(TokenType.OpenParen)),
                replace: (ast_stream: [ExpressionElement, ...ASTElement[]]) => {
                    const rest = ast_stream.slice(2, -1);
                    this.ApplyRecDescent(rest);
                    const args: ExpressionElement[] = [];
                    while (rest.length) {
                        const exp = rest.shift();
                        if (exp instanceof ExpressionElement) {
                            args.push(exp);
                        } else {
                            this.emitCompilationError(Errors.EXPECTED_EXPRESSION, "Expected expression", exp.source_location);
                            return [];
                        }
                        if (rest.length) {
                            const exp2 = rest.shift();
                            if (!(exp2 instanceof TokenElement && exp2.token.type == TokenType.Comma)) {
                                this.emitCompilationError(Errors.EXPECTED_COMMA, "Expected comma", exp2.source_location);
                                return [];
                            }
                        }
                    }

                    return [new FunctionCallExpression(LocationFrom(ast_stream), ast_stream[0], args)];
                }
            }, segment) || rc;

            rc = this.ApplySingleProductionRule({
                name: "FFICall",
                match: InOrder(MatchToken(TokenType.FFICall), MatchElementType("FunctionCallExpression")),
                replace: (ast_stream: [any, FunctionCallExpression]) => {
                    if (!(ast_stream[1].source instanceof NameExpression)) {
                        this.emitCompilationError(Errors.EXPECTED_NAME, "Expected name", ast_stream[1].source.source_location);
                        return [];
                    }
                    return [new FFICallExpression(
                        ast_stream[1].source_location,
                        ast_stream[1].source.name,
                        ast_stream[1].args
                    )];
                }
            }, segment) || rc;

            rc = this.ApplySingleProductionRule({
                name: "ConstructorCall",
                match: InOrder(MatchToken(TokenType.New), MatchElementType("FunctionCallExpression")),
                replace: (ast_stream: [any, FunctionCallExpression]) => {
                    if (!(ast_stream[1].source instanceof TypeElement)) {
                        this.emitCompilationError(Errors.EXPECTED_TYPE, "Expected type", ast_stream[1].source.source_location);
                        return [];
                    }
                    return [new ConstructorCallExpression(
                        ast_stream[1].source_location,
                        ast_stream[1].source as TypeElement,
                        ast_stream[1].args
                    )];
                }
            }, segment) || rc;

            rc = this.ApplySingleProductionRule({
                name: "Index",
                match: InOrder(MatchExpression(), Hug(TokenType.OpenBracket)),
                replace: (ast_stream: [ExpressionElement, ...ASTElement[]]) => {
                    const rest = ast_stream.slice(2, -1);
                    this.ApplyRecDescent(rest);
                    if (rest.length == 0) {
                        this.emitCompilationError(Errors.EXPECTED_EXPRESSION, "Expected expression", ast_stream[0].source_location);
                        return [];
                    }

                    if (!(rest[0] instanceof ExpressionElement)) {
                        this.emitCompilationError(Errors.EXPECTED_EXPRESSION, "Expected expression", rest[0].source_location);
                        return [];
                    }

                    if (rest.length > 1) {
                        this.emitCompilationError(Errors.EXPECTED_CLOSE_BRACKET, "Expected close bracket", rest[1].source_location);
                        return [];
                    }

                    return [new IndexExpression(LocationFrom(ast_stream), ast_stream[0], rest[0])];
                }
            }, segment) || rc;

            rc = this.ApplyMultipleProductionRules([
                Arithmetic("Multiplication", "*", TokenType.Asterisk),
                Arithmetic("Division", "/", TokenType.Slash),
                Arithmetic("Modulus", "%", TokenType.Percent),
            ], segment) || rc;

            rc = this.ApplyMultipleProductionRules([
                Arithmetic("Addition", "+", TokenType.Plus),
                Arithmetic("Subtraction", "-", TokenType.Minus),
            ], segment) || rc;


            rc = this.ApplyMultipleProductionRules([
                Comparison("GreaterThan", ">", TokenType.CloseAngle),
                Comparison("LessThan", "<", TokenType.OpenAngle),
            ], segment) || rc;

            rc = this.ApplySingleProductionRule({
                name: "SingleParenthesizedExpression",
                match: InOrder(
                    MatchToken(TokenType.OpenParen),
                    MatchExpression(),
                    MatchToken(TokenType.CloseParen)
                ),
                replace: (ast_stream: [any, ExpressionElement, any]) => [ast_stream[1]]
            }, segment) || rc;
        } while (rc);
    }

    apply() {
        CompilationUnit.mapWithin(["compound"], this.cu.ast_stream, (segment: ASTElement[]) => {
            this.ApplySingleProductionRule({
                name: "NameExpression",
                match: MatchToken(TokenType.Name),
                replace: (ast_stream: [TokenElement<NameToken>]) => {
                    return [new NameExpression(ast_stream[0].source_location, ast_stream[0].token.name)];
                }
            }, segment);

            this.ApplySingleProductionRule({
                name: "NumberExpression",
                match: MatchToken(TokenType.NumericLiteral),
                replace: (ast_stream: [TokenElement<NumericLiteralToken>]) => {
                    return [new NumberExpression(ast_stream[0].source_location, ast_stream[0].token.value)]
                }
            }, segment);

            this.ApplySingleProductionRule({
                name: "StringConstantExpression",
                match: MatchToken(TokenType.StringLiteral),
                replace: (ast_stream: [TokenElement<StringLiteralToken>]) => {
                    return [new StringConstantExpression(ast_stream[0].source_location, ast_stream[0].token.str)];
                }
            }, segment);

            this.ApplyRecDescent(segment);
        });
    }
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
        ),
        replace: (ast_stream: [ExpressionElement, TokenElement<any>, ExpressionElement]) => {
            return [new ComparisonExpression(LocationFrom(ast_stream), ast_stream[0], ast_stream[2], op)];
        },
        startOnly: true
    };
}

