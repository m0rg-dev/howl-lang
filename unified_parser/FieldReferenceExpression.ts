import { GEPStatement, IRBlock, IRLoad, IRPointerType, IRTemporary, isSynthesizable, Synthesizable } from "../generator/IR";
import { ASTElement } from "./ASTElement";
import { ClassType } from "./TypeObject";


export class FieldReferenceExpression extends ASTElement implements Synthesizable {
    source: ASTElement;
    field: string;

    constructor(source: ASTElement, field: string) {
        super(undefined);
        this.source = source;
        this.field = field;
    }

    toString = () => `${this.source.toString()}.${this.field}`;
    index(): number {
        if (this.source.value_type instanceof ClassType) {
            return this.source.value_type.source.fields.findIndex(x => x.name == this.field);
        }
        return -1;
    }

    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if(this._ir_block) return this._ir_block;
        if (!isSynthesizable(this.source)) throw new Error("attempted to synthesize FieldReferenceExpression of non-synthesizable");
        const source_block = this.source.synthesize();
        const temp = new IRTemporary();
        const temp2 = new IRTemporary();
        return this._ir_block = {
            output_location: {
                type: new IRPointerType(this.value_type.toIR()),
                location: temp2
            },
            statements: [
                new IRLoad({ type: (source_block.output_location.type as IRPointerType).sub, location: temp}, source_block.output_location),
                new GEPStatement({ type: new IRPointerType(this.value_type.toIR()), location: temp2 }, { type: (source_block.output_location.type as IRPointerType).sub, location: temp}, this.index())
            ],
            sub_blocks: [source_block]
        };
    }
}
