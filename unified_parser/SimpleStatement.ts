import { IRBlock, isSynthesizable, Synthesizable } from "../generator/IR";
import { ASTElement, TokenStream, VoidElement } from "./ASTElement";

export class SimpleStatement extends VoidElement implements Synthesizable {
    source: TokenStream;
    constructor(parent: ASTElement, source: TokenStream) {
        super(parent);
        this.source = source;
    }
    toString = () => `SimpleStatement`;

    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if(this._ir_block) return this._ir_block;
        if(this.source.length > 1 || !isSynthesizable(this.source[0])) return { output_location: undefined, statements: [] };
        return {
            output_location: undefined,
            statements: [],
            sub_blocks: [
                this.source[0].synthesize()
            ]
        };
    }
}


