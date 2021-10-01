import { ASTElement, MarkerElement } from "../ast/ASTElement";
import { ClassHeaderElement } from "../ast/ClassHeaderElement";
import { GenericElement } from "../ast/GenericElement";
import { TokenElement } from "../ast/TokenElement";
import { TokenType } from "../lexer/TokenType";
import { InOrder, MatchElementType, Until } from "../parser/Matcher";
import { CompilationUnit } from "./CompilationUnit";
import { Errors } from "./Errors";
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

                CompilationUnit.mapWithin(["compound"], as2, (segment: ASTElement[]) => {
                    this.ApplySingleProductionRule({
                        name: "FindErroneousGenericSubstitution",
                        match: MatchElementType("GenericElement"),
                        replace: (ast_stream: [GenericElement]) => {
                            this.emitCompilationError(Errors.COMPILER_BUG, "Aliasing or otherwise referencing a class generic within a function is currently disallowed due to compiler limitations", ast_stream[0].source_location);
                            return [];
                        }
                    }, segment);
                });

                return as2;
            }
        })
    }
}