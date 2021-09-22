import { ASTElement } from "../../ast/ASTElement";
import { PartialFunctionElement } from "../../ast/PartialFunctionElement";
import { TokenElement } from "../../ast/TokenElement";
import { TokenType } from "../../lexer/TokenType";
import { Hug, InOrder, MatchToken, Optional } from "../Matcher";
import { LocationFrom, ProductionRule } from "../Parser";

export const FunctionRules: ProductionRule[] = [
    {
        name: "FunctionConstruct",
        match: InOrder(
            Optional(MatchToken(TokenType.Static)),
            MatchToken(TokenType.Function),
            MatchToken(TokenType.Name),
            Hug(TokenType.OpenAngle),
            Hug(TokenType.OpenParen),
            Hug(TokenType.OpenAngle),
            Hug(TokenType.OpenBrace)
        ),
        replace: (ast_stream: ASTElement[]) => {
            let name: string;
            if (ast_stream[1] instanceof TokenElement
                && ast_stream[1].token.type == TokenType.Name) {
                name = ast_stream[1].token.name;
            } else if (ast_stream[2] instanceof TokenElement
                && ast_stream[2].token.type == TokenType.Name) {
                name = ast_stream[2].token.name;
            } else {
                return undefined;
            }
            return [new PartialFunctionElement(LocationFrom(ast_stream), ast_stream, name)];
        }
    }
];
