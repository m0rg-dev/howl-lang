import { IRAlloca, IRBaseType, IRBlock, IRIntegerCompare, IRLoad, IRPointerType, IRStore, IRTemporary, isSynthesizable, Synthesizable } from "../generator/IR";
import { GetType, TypeRegistry } from "../registry/TypeRegistry";
import { ExactConstraint, PortIntersectionConstraint } from "../typemath/Signature";
import { ASTElement } from "./ASTElement";

export class ComparisonExpression extends ASTElement implements Synthesizable {
    comp_type: string;
    lhs: ASTElement;
    rhs: ASTElement;

    constructor(parent: ASTElement, lhs: ASTElement, rhs: ASTElement, type: string) {
        super(parent);
        this.comp_type = type;
        this.lhs = lhs;
        this.rhs = rhs;

        this.signature.ports.add("lhs");
        this.signature.ports.add("rhs");
        this.signature.port_constraints.push(new PortIntersectionConstraint("lhs", "rhs"));
        this.signature.ports.add("value");
        this.signature.type_constraints.set("value", new ExactConstraint("value", GetType("bool")));
    }

    toString = () => `${this.lhs} ${this.comp_type} ${this.rhs}`;
    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if (this._ir_block) return this._ir_block;
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

        const comp = new IRIntegerCompare(
            { type: new IRBaseType("i1"), location: out_temp },
            { type: (lhs_block.output_location.type as IRPointerType).sub, location: lhs_temp },
            { type: (rhs_block.output_location.type as IRPointerType).sub, location: rhs_temp },
            this.comp_type
        );

        const alloca = new IRAlloca({ type: new IRPointerType(new IRBaseType("i1")), location: out });

        const out_store = new IRStore(
            { type: new IRBaseType("i1"), location: out_temp },
            { type: new IRPointerType(new IRBaseType("i1")), location: out }
        );

        return this._ir_block = {
            output_location: { type: new IRPointerType(new IRBaseType("i1")), location: out },
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