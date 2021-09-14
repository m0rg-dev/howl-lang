import { FunctionType } from "./TypeObject";
import { ASTElement } from "./ASTElement";
import { IRAlloca, IRBlock, IRCall, IRLoad, IRPointerType, IRStore, IRTemporary, IRVoidCall, isSynthesizable, Synthesizable } from "../generator/IR";
import { GetType } from "../registry/TypeRegistry";


export class FunctionCallExpression extends ASTElement implements Synthesizable {
    source: ASTElement;
    args: ASTElement[];
    self_added = false;

    constructor(parent: ASTElement, source: ASTElement, args: ASTElement[]) {
        super(GetType("void"), parent);
        console.error(source);
        if (!(source.value_type instanceof FunctionType)) {
            //throw new Error(`Tried to call non-function ${source.value_type}`);
        } else {
            this.value_type = source.value_type.rc;
        }
        this.source = source;
        this.args = args;
    }

    toString = () => `${this.source.toString()}(${this.args.map(x => x.toString()).join(", ")})`;
    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if (this._ir_block) return this._ir_block;
        if (!isSynthesizable(this.source)) return { output_location: undefined, statements: [] };
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

        if (this.value_type.toIR() != "void") {
            rc.output_location = {
                type: new IRPointerType(this.value_type.toIR()),
                location: out
            };
            rc.statements.push(new IRCall({ type: this.value_type.toIR(), location: out_val },
                { type: (source_block.output_location.type as IRPointerType).sub, location: src_temp },
                arg_temps.map((x, y) => { return { type: (arg_blocks[y].output_location.type as IRPointerType).sub, location: x } })));
            rc.statements.push(new IRAlloca({ type: new IRPointerType(this.value_type.toIR()), location: out }));
            rc.statements.push(new IRStore({ type: this.value_type.toIR(), location: out_val },
                { type: new IRPointerType(this.value_type.toIR()), location: out }))
        } else {
            rc.statements.push(new IRVoidCall(
                { type: (source_block.output_location.type as IRPointerType).sub, location: src_temp },
                arg_temps.map((x, y) => { return { type: (arg_blocks[y].output_location.type as IRPointerType).sub, location: x } })));
        }

        return this._ir_block = rc;
    }
}
