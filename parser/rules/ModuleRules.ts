import { ASTElement } from "../../ast/ASTElement";
import { ModuleDefinitionElement } from "../../ast/ModuleDefinitionElement";
import { SyntaxErrorElement } from "../../ast/SyntaxErrorElement";
import { TokenElement } from "../../ast/TokenElement";
import { NameToken } from "../../lexer/NameToken";
import { TokenType } from "../../lexer/TokenType";
import { InOrder, MatchToken, AssertNegative, Any } from "../Matcher";
import { ProductionRule, LocationFrom, ResynchronizeTopLevel } from "../Parser";

export const ModuleRules: ProductionRule[] = [
    {
        name: "ModuleConstruct",
        match: InOrder(
            MatchToken(TokenType.Module),
            MatchToken(TokenType.Name),
            MatchToken(TokenType.Semicolon)
        ),
        replace: (ast_stream: [any, TokenElement<NameToken>, any]) => {
            return [new ModuleDefinitionElement(LocationFrom(ast_stream), ast_stream[1].token.name)];
        }
    },
    {
        name: "ModuleMissingSemicolon",
        match: InOrder(
            MatchToken(TokenType.Module),
            MatchToken(TokenType.Name),
            AssertNegative(MatchToken(TokenType.Semicolon)),
            Any(),
            ResynchronizeTopLevel
        ),
        replace: (ast_stream: [any, TokenElement<NameToken>, ASTElement]) => {
            return [new SyntaxErrorElement(LocationFrom(ast_stream),
                `Expected semicolon after 'module ${ast_stream[1].token.name}', found ${ast_stream[2]}`
            )];
        }
    },
    {
        name: "ModuleMissingName",
        match: InOrder(
            MatchToken(TokenType.Module),
            AssertNegative(MatchToken(TokenType.Name)),
            Any(),
            ResynchronizeTopLevel
        ),
        replace: (ast_stream: [any, ASTElement]) => {
            return [new SyntaxErrorElement(LocationFrom(ast_stream),
                `Expected name after 'module', found ${ast_stream[1]}`
            )];
        }
    }
];
