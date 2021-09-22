import { ExpressionElement, NameExpression } from "../../ast/ExpressionElement";
import { AssignmentStatement, LocalDefinitionStatement, NullaryReturnStatement, SimpleStatement, UnaryReturnStatement } from "../../ast/StatementElement";
import { TokenElement } from "../../ast/TokenElement";
import { TokenType } from "../../lexer/TokenType";
import { AssertEnd, InOrder, MatchElementType, MatchToken } from "../Matcher";
import { LocationFrom, RuleList } from "../Parser";
import { MatchExpression, ParseExpression } from "./ParseExpression";

export const ParseStatement: RuleList = {
    name: "ParseStatement",
    rules: [
        ...ParseExpression.rules,
        {
            name: "AssignmentStatement",
            match: InOrder(
                MatchExpression(),
                MatchToken(TokenType.Equals),
                MatchExpression(),
                AssertEnd()
            ),
            replace: (ast_stream: [ExpressionElement, TokenElement<any>, ExpressionElement]) => {
                return [new AssignmentStatement(LocationFrom(ast_stream), ast_stream[0], ast_stream[2])]
            },
            startOnly: true
        },
        {
            name: "LocalDefinitionStatement",
            match: InOrder(
                MatchToken(TokenType.Let),
                MatchElementType("NameExpression"),
                AssertEnd()
            ),
            replace: (ast_stream: [TokenElement<any>, NameExpression]) => {
                return [new LocalDefinitionStatement(LocationFrom(ast_stream), ast_stream[1].name)];
            },
            startOnly: true
        },
        {
            name: "NullaryReturnStatement",
            match: InOrder(
                MatchToken(TokenType.Return),
                AssertEnd()
            ),
            replace: (ast_stream: [TokenElement<any>]) => {
                return [new NullaryReturnStatement(LocationFrom(ast_stream))];
            },
            startOnly: true
        },
        {
            name: "UnaryReturnStatement",
            match: InOrder(
                MatchToken(TokenType.Return),
                MatchExpression(),
                AssertEnd()
            ),
            replace: (ast_stream: [TokenElement<any>, ExpressionElement]) => {
                return [new UnaryReturnStatement(LocationFrom(ast_stream), ast_stream[1])];
            },
            startOnly: true
        },
        {
            name: "SimpleStatement",
            match: InOrder(
                MatchExpression(),
                AssertEnd()
            ),
            replace: (ast_stream: [ExpressionElement]) => {
                return [new SimpleStatement(LocationFrom(ast_stream), ast_stream[0])];
            },
            startOnly: true
        }
    ]
};
