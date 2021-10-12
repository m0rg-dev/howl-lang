import { ImportElement } from "../ast/ImportElement";
import { TokenElement } from "../ast/TokenElement";
import { TokenType } from "../lexer/TokenType";
import { InOrder, MatchToken, Star } from "../parser/Matcher";
import { LocationFrom } from "../parser/Parser";
import { Pass } from "./Pass";

export class FindImportsPass extends Pass {
    apply() {
        this.ApplySingleProductionRule({
            name: "Import",
            match: InOrder(
                MatchToken(TokenType.Import),
                MatchToken(TokenType.Name),
                Star(
                    InOrder(
                        MatchToken(TokenType.Period),
                        MatchToken(TokenType.Name)
                    )
                ),
                MatchToken(TokenType.Semicolon)
            ),
            replace: (ast_stream: TokenElement<any>[]) => {
                return [new ImportElement(LocationFrom(ast_stream), ast_stream.slice(1, ast_stream.length - 1).map(x => x.token.name).join("."))];
            }
        });
    }
}
