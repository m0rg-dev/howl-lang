import { TokenElement } from "../ast/TokenElement";
import { SimpleTypeElement } from "../ast/TypeElement";
import { NameToken } from "../lexer/NameToken";
import { TokenType } from "../lexer/TokenType";
import { InOrder, MatchToken } from "../parser/Matcher";
import { TypeNames } from "../registry/Registry";
import { Pass } from "./Pass";

export class ReplaceTypesPass extends Pass {
    apply() {
        this.ApplySingleProductionRule({
            name: "ReplaceTypes",
            match: InOrder(
                MatchToken(TokenType.Name)
            ),
            replace: (ast_stream: [TokenElement<NameToken>]) => {
                if (TypeNames.has(ast_stream[0].token.name))
                    return [
                        new SimpleTypeElement(ast_stream[0].source_location, ast_stream[0].token.name)
                    ];
            }
        });
    }
}