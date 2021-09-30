import { ASTElement, MarkerElement } from "../ast/ASTElement";
import { ClassHeaderElement } from "../ast/ClassHeaderElement";
import { GenericElement } from "../ast/GenericElement";
import { TokenElement } from "../ast/TokenElement";
import { TokenType } from "../lexer/TokenType";
import { InOrder, MatchElementType, Until } from "../parser/Matcher";
import { CompilationUnit } from "./CompilationUnit";
import { Pass } from "./Pass";

export class ReplaceClassGenericsPass extends Pass {
    apply() {
        this.ApplySingleProductionRule({
            name: "ReplaceClassGenerics",
            match: InOrder(
                MatchElementType("ClassHeaderElement"),
                MatchElementType("MarkerElement"),
                Until((m: ASTElement[]) => {
                    return (m[0] instanceof MarkerElement) && m[0].is_closer && m[0].type == "cdecl"
                        ? [true, 1] : [false, 0]
                })
            ),
            replace: (ast_stream: [ClassHeaderElement, ...ASTElement[]]) => {
                const as2 = [...ast_stream];
                CompilationUnit.mapWithin(["cbody", "fdecl"], as2, segment => {
                    segment.forEach((x, idx) => {
                        if (x instanceof TokenElement
                            && x.token.type == TokenType.Name
                            && ast_stream[0].generics.some(y => y == x.token.name)) {
                            segment[idx] = new GenericElement(x.source_location, x.token.name);
                        }
                    });
                });
                return as2;
            }
        })
    }
}