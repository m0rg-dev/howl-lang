import { CompoundStatementElement } from "../ast/CompoundStatementElement";
import { FunctionElement } from "../ast/FunctionElement";
import { FunctionHeaderElement } from "../ast/FunctionHeaderElement";
import { InOrder, MatchElementType } from "../parser/Matcher";
import { LocationFrom } from "../parser/Parser";
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
                return [new FunctionElement(
                    LocationFrom(ast_stream),
                    this.cu.module,
                    ast_stream[0].name,
                    ast_stream[0].returns,
                    undefined,
                    ast_stream[0].args,
                    ast_stream[0].is_static,
                    ast_stream[1]
                )];
            }
        })
    }
}