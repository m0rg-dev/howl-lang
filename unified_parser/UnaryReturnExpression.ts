import { IRBlock, IRLoad, IRPointerType, IRTemporary, IRUnaryReturn, isSynthesizable, Synthesizable } from "../generator/IR";
import { ASTElement, VoidElement } from "./ASTElement";


export class UnaryReturnExpression extends VoidElement implements Synthesizable {
    source: ASTElement;

    constructor(source: ASTElement) {
        super();
        this.source = source;
    }

    toString = () => `return ${this.source.toString()}`;

    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if (this._ir_block) return this._ir_block;
        if (!isSynthesizable(this.source)) return {output_location:undefined,statements:[]}; //throw new Error("attempted to synthesize UnaryReturnExpression of non-synthesizable");
        const source_block = this.source.synthesize();
        console.error(source_block);
        const temp = new IRTemporary();
        return this._ir_block = {
            output_location: undefined,
            statements: [
                new IRLoad(
                    { type: (source_block.output_location.type as IRPointerType).sub, location: temp },
                    source_block.output_location
                ),
                new IRUnaryReturn({ type: (source_block.output_location.type as IRPointerType).sub, location: temp })
            ],
            sub_blocks: [
                source_block
            ]
        };
    }
}
