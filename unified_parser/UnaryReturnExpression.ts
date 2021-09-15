import { IRBlock, IRLoad, IRPointerType, IRTemporary, IRUnaryReturn, isSynthesizable, Synthesizable } from "../generator/IR";
import { OutgoingConstraint, ReturnTypeConstraint } from "../typemath/Signature";
import { ASTElement } from "./ASTElement";


export class UnaryReturnExpression extends ASTElement implements Synthesizable {
    source: ASTElement;

    constructor(parent: ASTElement, source: ASTElement) {
        super(parent);
        this.source = source;

        this.signature.ports.add("source");
        this.signature.port_constraints.push(new OutgoingConstraint("source", new ReturnTypeConstraint("value")));
    }

    toString = () => `return ${this.source.toString()}`;

    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if (this._ir_block) return { output_location: this._ir_block.output_location, statements: [] };
        if (!isSynthesizable(this.source)) return { output_location: undefined, statements: [] }; //throw new Error("attempted to synthesize UnaryReturnExpression of non-synthesizable");
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
