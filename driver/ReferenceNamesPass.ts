import { TokenElement } from "../ast/TokenElement";
import { TokenType } from "../lexer/TokenType";
import { InOrder, MatchToken, Plus } from "../parser/Matcher";
import { Classes, TypeNames } from "../registry/Registry";
import { Pass } from "./Pass";

export class ReferenceNamesPass extends Pass {
    apply() {
        this.ApplySingleProductionRule({
            name: "ReferenceNames",
            match: InOrder(
                MatchToken(TokenType.Name),
                Plus(
                    InOrder(
                        MatchToken(TokenType.Period),
                        MatchToken(TokenType.Name)
                    )
                )
            ),
            replace: (ast_stream: TokenElement<any>[]) => {
                for (const idx in ast_stream) {
                    const idx_n = Number.parseInt(idx);
                    const new_name = ast_stream.slice(0, idx_n + 1).reduce((prev, el) => prev + el.token.text, "").trim();
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
                return undefined;
            }
        })
    }
}