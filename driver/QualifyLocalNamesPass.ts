import { TokenElement } from "../ast/TokenElement";
import { NameToken } from "../lexer/NameToken";
import { TokenType } from "../lexer/TokenType";
import { InOrder, MatchToken } from "../parser/Matcher";
import { Pass } from "./Pass";

export class QualifyLocalNamesPass extends Pass {
    apply() {
        this.ApplySingleProductionRule({
            name: "QualifyName",
            match: InOrder(
                MatchToken(TokenType.Name)
            ),
            replace: (ast_stream: [TokenElement<NameToken>]) => {
                if (this.cu.class_names.has(ast_stream[0].token.name)) {
                    ast_stream[0].token.name = this.cu.module.getFQN().toString() + "." + ast_stream[0].token.name;
                    ast_stream[0].token.text = ast_stream[0].token.name;
                    return [ast_stream[0]];
                }
                return undefined;
            }
        })
    }
}
