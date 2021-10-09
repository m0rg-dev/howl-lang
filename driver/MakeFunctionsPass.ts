import { CompoundStatementElement } from "../ast/CompoundStatementElement";
import { FunctionHeaderElement } from "../ast/FunctionHeaderElement";
import { InOrder, MatchElementType } from "../parser/Matcher";
import { Pass } from "./Pass";

export class MakeFunctionsPass extends Pass {
    apply() {
        this.ApplySingleProductionRule({
            name: "FunctionDefinition",
            match: InOrder(
                MatchElementType("FunctionHeaderElement"),
                MatchElementType("CompoundStatementElement"),
            ),
            replace: (ast_stream: [FunctionHeaderElement, CompoundStatementElement]) => {
                return [ast_stream[0].toFunction(this.cu, ast_stream[1])];
            }
        })
    }
}