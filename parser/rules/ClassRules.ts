import { ASTElement } from "../../ast/ASTElement";
import { HasFQN } from "../../ast/FQN";
import { PartialClassElement } from "../../ast/PartialClassElement";
import { SyntaxErrorElement } from "../../ast/SyntaxErrorElement";
import { TokenElement } from "../../ast/TokenElement";
import { NameToken } from "../../lexer/NameToken";
import { TokenType } from "../../lexer/TokenType";
import { AssertNegative, Hug, InOrder, MatchToken } from "../Matcher";
import { LocationFrom, ProductionRule, ResynchronizeTopLevel } from "../Parser";

export function ClassRules(parent: HasFQN): ProductionRule[] {
    return [
        {
            name: "ClassConstruct",
            match: InOrder(
                MatchToken(TokenType.Class),
                MatchToken(TokenType.Name),
                Hug(TokenType.OpenAngle),
                Hug(TokenType.OpenBrace)
            ),
            replace: (ast_stream: [any, TokenElement<NameToken>, ...ASTElement[]]) => {
                return [new PartialClassElement(LocationFrom(ast_stream), ast_stream, parent, ast_stream[1].token.name)];
            }
        },
        {
            name: "ClassMissingBody",
            match: InOrder(
                MatchToken(TokenType.Class),
                MatchToken(TokenType.Name),
                Hug(TokenType.OpenAngle),
                AssertNegative(Hug(TokenType.OpenBrace)),
                ResynchronizeTopLevel
            ),
            replace: (ast_stream: [any, TokenElement<NameToken>, ...ASTElement[]]) => {
                return [new SyntaxErrorElement(LocationFrom(ast_stream),
                    `Failed to parse class body for ${ast_stream[1].token.name} (check bracket matching)`
                )];
            }
        },
        {
            name: "ClassMissingTypes",
            match: InOrder(
                MatchToken(TokenType.Class),
                MatchToken(TokenType.Name),
                AssertNegative(Hug(TokenType.OpenAngle)),
                ResynchronizeTopLevel
            ),
            replace: (ast_stream: [any, TokenElement<NameToken>, ...ASTElement[]]) => {
                return [new SyntaxErrorElement(LocationFrom(ast_stream),
                    `Failed to parse class types for ${ast_stream[1].token.name} (check bracket matching)`
                )]
            }
        }
    ];
}

