import { ASTElement, MarkerElement } from "../ast/ASTElement";
import { ClassElement } from "../ast/ClassElement";
import { ClassHeaderElement } from "../ast/ClassHeaderElement";
import { FunctionElement } from "../ast/FunctionElement";
import { TypedItemElement } from "../ast/TypedItemElement";
import { SimpleTypeElement, TypeElement } from "../ast/TypeElement";
import { InOrder, MatchElementType, Until } from "../parser/Matcher";
import { Errors } from "./Errors";
import { Pass } from "./Pass";

export class MakeClassesPass extends Pass {
    apply() {
        this.ApplySingleProductionRule({
            name: "ReplaceClassGenerics",
            match: InOrder(
                MatchElementType("ClassHeaderElement"),
                MatchElementType("MarkerElement"),
                Until((m: ASTElement[]) => {
                    return (m[0] instanceof MarkerElement) && m[0].is_closer && m[0].type == "cbody"
                        ? [true, 1] : [false, 0]
                }),
                MatchElementType("MarkerElement")
            ),
            replace: (ast_stream: [ClassHeaderElement, ...ASTElement[]]) => {
                const rest = ast_stream.slice(2, -1); // drop markers
                const fields: TypedItemElement[] = [];
                const methods: FunctionElement[] = [];

                rest.forEach(x => {
                    if (x instanceof TypedItemElement) {
                        fields.push(x);
                    } else if (x instanceof FunctionElement) {
                        x.self_type = new TypeElement(ast_stream[0].source_location,
                            new SimpleTypeElement(ast_stream[0].source_location, ast_stream[0].name),
                            []);
                        methods.push(x);
                    } else {
                        this.emitCompilationError(Errors.COMPILER_BUG, "not TypedItem or Function?", x.source_location);
                        return [];
                    }
                });

                const cl = new ClassElement(ast_stream[0].source_location, ast_stream[0].name, fields, methods, ast_stream[0].generics);
                return [cl];
            }
        });
    }
}