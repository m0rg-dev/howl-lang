import { ASTElement, MarkerElement } from "../ast/ASTElement";
import { TokenElement } from "../ast/TokenElement";
import { TokenType } from "../lexer/TokenType";
import { Hug, InOrder, MatchToken, Optional, Star, Until } from "../parser/Matcher";
import { Pass } from "./Pass";

export class MarkFunctionsPass extends Pass {
    apply() {
        this.ApplySingleProductionRule({
            name: "MarkFunction",
            match: InOrder(
                Optional(MatchToken(TokenType.Static)),
                MatchToken(TokenType.Function),
                MatchToken(TokenType.Name),
                MatchToken(TokenType.Name),
                Hug(TokenType.OpenParen),
                Optional(
                    InOrder(
                        MatchToken(TokenType.Throws),
                        MatchToken(TokenType.Name),
                        Star(InOrder(
                            MatchToken(TokenType.Comma),
                            MatchToken(TokenType.Name),
                        ))
                    )
                ),
                Hug(TokenType.OpenBrace)
            ),
            replace: (ast_stream: ASTElement[]) => {
                let start_idx = 3;
                if (ast_stream[0] instanceof TokenElement && ast_stream[0].token.type == TokenType.Static) {
                    start_idx++;
                }

                start_idx += Hug(TokenType.OpenParen)(ast_stream.slice(start_idx))[1];
                start_idx += Until(MatchToken(TokenType.OpenBrace))(ast_stream.slice(start_idx))[1];

                return [
                    new MarkerElement(ast_stream[0].source_location, "fdecl", false),
                    ...ast_stream.slice(0, start_idx),
                    new MarkerElement(ast_stream[start_idx].source_location, "fdecl", true),
                    new MarkerElement(ast_stream[start_idx].source_location, "compound", false),
                    ...ast_stream.slice(start_idx),
                    new MarkerElement(ast_stream[ast_stream.length - 1].source_location, "compound", true)];
            }
        })
    }
}