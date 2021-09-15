import { IRAlloca, IRBaseType, IRBlock, IRIntegerCompare, IRIntegerMath, IRLoad, IRPointerType, IRStore, IRTemporary, isSynthesizable, Synthesizable } from "../generator/IR";
import { TypeRegistry } from "../registry/TypeRegistry";
import { AllConstraint, PortIntersectionConstraint } from "../typemath/Signature";
import { ASTElement } from "./ASTElement";

export class ArithmeticExpression extends ASTElement implements Synthesizable {
    op: string;
    lhs: ASTElement;
    rhs: ASTElement;

    constructor(parent: ASTElement, lhs: ASTElement, rhs: ASTElement, type: string) {
        super(parent);
        this.op = type;
        this.lhs = lhs;
        this.rhs = rhs;

        this.signature.ports.add("lhs");
        this.signature.ports.add("rhs");
        this.signature.ports.add("value");
        this.signature.port_constraints.push(new PortIntersectionConstraint("lhs", "rhs"));
        this.signature.port_constraints.push(new PortIntersectionConstraint("lhs", "value"));
        this.signature.type_constraints.set("value", new AllConstraint("value"));
    }

    toString = () => `${this.lhs} ${this.op} ${this.rhs}`;
    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if (this._ir_block) return { output_location: this._ir_block.output_location, statements: [] };
        if (!isSynthesizable(this.lhs)) return { output_location: undefined, statements: [] };
        if (!isSynthesizable(this.rhs)) return { output_location: undefined, statements: [] };

        const lhs_block = this.lhs.synthesize();
        const rhs_block = this.rhs.synthesize();

        const lhs_temp = new IRTemporary();
        const rhs_temp = new IRTemporary();
        const out_temp = new IRTemporary();
        const out = new IRTemporary();

        const lhs_load = new IRLoad(
            { type: (lhs_block.output_location.type as IRPointerType).sub, location: lhs_temp },
            lhs_block.output_location
        );

        const rhs_load = new IRLoad(
            { type: (rhs_block.output_location.type as IRPointerType).sub, location: rhs_temp },
            rhs_block.output_location
        );

        const comp = new IRIntegerMath(
            { type: this.computed_type.toIR(), location: out_temp },
            { type: (lhs_block.output_location.type as IRPointerType).sub, location: lhs_temp },
            { type: (rhs_block.output_location.type as IRPointerType).sub, location: rhs_temp },
            this.op
        );

        const alloca = new IRAlloca({ type: new IRPointerType(this.computed_type.toIR()), location: out });

        const out_store = new IRStore(
            { type: this.computed_type.toIR(), location: out_temp },
            { type: new IRPointerType(this.computed_type.toIR()), location: out }
        );

        return this._ir_block = {
            output_location: { type: new IRPointerType(this.computed_type.toIR()), location: out },
            statements: [
                lhs_load,
                rhs_load,
                comp,
                alloca,
                out_store
            ],
            sub_blocks: [
                lhs_block,
                rhs_block
            ]
        };
    }
}
