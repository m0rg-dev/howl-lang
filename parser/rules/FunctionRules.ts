import { ASTElement } from "../../ast/ASTElement";
import { HasFQN } from "../../ast/FQN";
import { PartialFunctionElement } from "../../ast/PartialFunctionElement";
import { TokenElement } from "../../ast/TokenElement";
import { TokenType } from "../../lexer/TokenType";
import { Hug, InOrder, MatchToken, Optional } from "../Matcher";
import { LocationFrom, ProductionRule } from "../Parser";

export function FunctionRules(parent: HasFQN): ProductionRule[] {
    return [
        {
            name: "FunctionConstruct",
            match: InOrder(
                Optional(MatchToken(TokenType.Static)),
                MatchToken(TokenType.Function),
                MatchToken(TokenType.Name),
                MatchToken(TokenType.Name),
                Hug(TokenType.OpenParen),
                Hug(TokenType.OpenBrace)
            ),
            replace: (ast_stream: ASTElement[]) => {
                let name: string;
                if (ast_stream[3] instanceof TokenElement
                    && ast_stream[3].token.type == TokenType.Name) {
                    name = ast_stream[3].token.name;
                } else if (ast_stream[2] instanceof TokenElement
                    && ast_stream[2].token.type == TokenType.Name) {
                    name = ast_stream[2].token.name;
                } else {
                    return undefined;
                }
                return [new PartialFunctionElement(LocationFrom(ast_stream), ast_stream, parent, name)];
            }
        }
    ]
}
