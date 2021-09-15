import { IRAlloca, IRBlock, IRCall, IRLoad, IRPointerType, IRStore, IRTemporary, IRVoidCall, isSynthesizable, Synthesizable } from "../generator/IR";
import { AllConstraint, AnyFunctionConstraint, OutgoingConstraint } from "../typemath/Signature";
import { ASTElement } from "./ASTElement";


export class FunctionCallExpression extends ASTElement implements Synthesizable {
    source: ASTElement;
    args: ASTElement[];
    self_added = false;
    args_generated = false;

    constructor(parent: ASTElement, source: ASTElement, args: ASTElement[]) {
        super(parent);
        this.source = source;
        this.args = args;

        this.signature.ports.add("value");
        this.signature.ports.add("source");
        args.forEach((x, y) => {
            this.signature.ports.add(`arg${y}`);
            this[`arg${y}`] = x;
        });

        this.signature.port_constraints.push(new OutgoingConstraint("source", new AnyFunctionConstraint("value")));
        this.signature.type_constraints.set("value", new AllConstraint("value"));
    }

    toString = () => `${this.source.toString()}(${this.args.map(x => x.toString()).join(", ")})`;
    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if (this._ir_block) return { output_location: this._ir_block.output_location, statements: [] };
        if (!isSynthesizable(this.source)) throw new Error(`Attempted to synthesize call of non-synthesizable ${this.source}`);
        if (this.args.some(x => !isSynthesizable(x))) return { output_location: undefined, statements: [] };

        const source_block = this.source.synthesize();
        const arg_blocks = this.args.map(x => {
            if (!isSynthesizable(x)) return; // redundant type guard so compiler doesn't complain
            return x.synthesize();
        });

        const src_temp = new IRTemporary();
        const arg_temps = this.args.map(_ => new IRTemporary());

        const src_load = new IRLoad(
            { type: (source_block.output_location.type as IRPointerType).sub, location: src_temp },
            source_block.output_location
        );

        const arg_loads = this.args.map((x, y) => {
            return new IRLoad(
                { type: (arg_blocks[y].output_location.type as IRPointerType).sub, location: arg_temps[y] },
                arg_blocks[y].output_location
            )
        });

        const out_val = new IRTemporary();
        const out = new IRTemporary();

        const rc: IRBlock = {
            output_location: undefined,
            statements: [
                src_load,
                ...arg_loads,
            ],
            sub_blocks: [
                source_block,
                ...arg_blocks
            ]
        };

        if (this.computed_type.toIR() != "void") {
            rc.output_location = {
                type: new IRPointerType(this.computed_type.toIR()),
                location: out
            };
            rc.statements.push(new IRCall({ type: this.computed_type.toIR(), location: out_val },
                { type: (source_block.output_location.type as IRPointerType).sub, location: src_temp },
                arg_temps.map((x, y) => { return { type: (arg_blocks[y].output_location.type as IRPointerType).sub, location: x } })));
            rc.statements.push(new IRAlloca({ type: new IRPointerType(this.computed_type.toIR()), location: out }));
            rc.statements.push(new IRStore({ type: this.computed_type.toIR(), location: out_val },
                { type: new IRPointerType(this.computed_type.toIR()), location: out }))
        } else {
            rc.statements.push(new IRVoidCall(
                { type: (source_block.output_location.type as IRPointerType).sub, location: src_temp },
                arg_temps.map((x, y) => { return { type: (arg_blocks[y].output_location.type as IRPointerType).sub, location: x } })));
        }

        return this._ir_block = rc;
    }
}
