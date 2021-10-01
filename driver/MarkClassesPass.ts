import { ASTElement, MarkerElement } from "../ast/ASTElement";
import { TokenElement } from "../ast/TokenElement";
import { TokenType } from "../lexer/TokenType";
import { InOrder, MatchToken, Optional, Hug } from "../parser/Matcher";
import { Pass } from "./Pass";

export class MarkClassesPass extends Pass {
    apply() {
        this.ApplySingleProductionRule({
            name: "MarkClass",
            match: InOrder(
                MatchToken(TokenType.Class),
                MatchToken(TokenType.Name),
                Optional(Hug(TokenType.OpenAngle)),
                Hug(TokenType.OpenBrace)
            ),
            replace: (ast_stream: ASTElement[]) => {
                let start_idx = 2;
                if (ast_stream[2] instanceof TokenElement && ast_stream[2].token.type == TokenType.OpenAngle) {
                    // get rid of the generic list, if it's there
                    const [_, l] = Hug(TokenType.OpenAngle)(ast_stream.slice(2));
                    start_idx += l;
                }

                return [
                    new MarkerElement(ast_stream[0].source_location, "cdecl", false),
                    ...ast_stream.slice(0, start_idx),
                    new MarkerElement(ast_stream[2].source_location, "cdecl", true),
                    new MarkerElement(ast_stream[2].source_location, "cbody", false),
                    ...ast_stream.slice(start_idx),
                    new MarkerElement(ast_stream[ast_stream.length - 1].source_location, "cbody", true)];
            }
        })
    }
}
