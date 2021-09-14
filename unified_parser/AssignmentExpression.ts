import { IRBlock, IRLoad, IRPointerType, IRStore, IRTemporary, isSynthesizable, Synthesizable } from "../generator/IR";
import { IntersectionConstraint } from "../typemath/Signature";
import { ASTElement, VoidElement } from "./ASTElement";

export class AssignmentExpression extends VoidElement implements Synthesizable {
    lhs: ASTElement;
    rhs: ASTElement;
    constructor(parent: ASTElement, lhs: ASTElement, rhs: ASTElement) {
        super(parent);
        this.lhs = lhs;
        this.rhs = rhs;

        this.signature.ports.add("lhs");
        this.signature.ports.add("rhs");
        this.signature.port_constraints.push(new IntersectionConstraint("lhs", "rhs"));
    }

    toString = () => `${this.lhs.toString()} = ${this.rhs.toString()}`;

    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if(this._ir_block) return this._ir_block;
        if (!isSynthesizable(this.lhs)) return { output_location: undefined, statements: [] };
        if (!isSynthesizable(this.rhs)) return { output_location: undefined, statements: [] };

        const lhs_block = this.lhs.synthesize();
        const rhs_block = this.rhs.synthesize();

        const temp = new IRTemporary();
        const rhs_load = new IRLoad(
            { type: (rhs_block.output_location.type as IRPointerType).sub, location: temp},
            rhs_block.output_location
        );

        const lhs_store = new IRStore(
            { type: (rhs_block.output_location.type as IRPointerType).sub, location: temp},
            lhs_block.output_location
        );

        return this._ir_block = {
            output_location: undefined,
            statements: [
                rhs_load,
                lhs_store
            ],
            sub_blocks: [
                lhs_block,
                rhs_block
            ]
        };
    }
}
