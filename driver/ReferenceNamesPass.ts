import { TokenElement } from "../ast/TokenElement";
import { TokenType } from "../lexer/TokenType";
import { InOrder, MatchToken, Star } from "../parser/Matcher";
import { SearchPath, TypeNames } from "../registry/Registry";
import { LogLevel, Pass } from "./Pass";

export class ReferenceNamesPass extends Pass {
    apply() {
        this.ApplySingleProductionRule({
            name: "ReferenceNames",
            match: InOrder(
                MatchToken(TokenType.Name),
                Star(
                    InOrder(
                        MatchToken(TokenType.Period),
                        MatchToken(TokenType.Name)
                    )
                )
            ),
            replace: (ast_stream: TokenElement<any>[]) => {
                this.log(LogLevel.TRACE, `Search path: ${SearchPath.join(", ")}`);
                for (const idx in ast_stream) {
                    const idx_n = Number.parseInt(idx);
                    if (ast_stream[idx] instanceof TokenElement && ast_stream[idx].token.type == TokenType.Period) continue;
                    for (const prefix of SearchPath) {
                        const new_name = prefix + ast_stream.slice(0, idx_n + 1).reduce((prev, el) => prev + el.token.text, "").trim();
                        // this.log(LogLevel.TRACE, `Candidate name: ${ast_stream.slice(0, idx_n + 1).reduce((prev, el) => prev + el.token.text, "").trim()} => ${new_name}`);
                        if (TypeNames.has(new_name)) {
                            const new_element = new TokenElement({
                                type: TokenType.Name,
                                start: ast_stream[0].token.start,
                                length: new_name.length,
                                text: new_name,
                                name: new_name
                            }, this.cu);

                            return [new_element, ...ast_stream.slice(idx_n + 1)];
                        }
                    }
                }
                return undefined;
            }
        })
    }
}