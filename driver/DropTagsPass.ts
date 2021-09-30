import { MarkerElement } from "../ast/ASTElement";
import { CompilationUnit } from "./CompilationUnit";
import { Pass } from "./Pass";

export class DropTagsPass extends Pass {
    type: string;

    constructor(cu: CompilationUnit, type: string) {
        super(cu);
        this.type = type;
    }

    apply() {
        this.cu.ast_stream = this.cu.ast_stream.filter(x => {
            if (x instanceof MarkerElement) {
                return x.type != this.type;
            }
            return true;
        })
    }
}