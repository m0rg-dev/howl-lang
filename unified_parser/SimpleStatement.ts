import { IRBlock, isSynthesizable, Synthesizable } from "../generator/IR";
import { ASTElement, TokenStream } from "./ASTElement";

export class SimpleStatement extends ASTElement implements Synthesizable {
    source: TokenStream;
    constructor(parent: ASTElement, source: TokenStream) {
        super(parent);
        this.source = source;
    }
    toString = () => `SimpleStatement`;

    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if(this._ir_block) return { output_location: this._ir_block.output_location, statements: [] };
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


