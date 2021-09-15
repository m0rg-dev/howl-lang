import { GEPStructStatement, IRBlock, IRLoad, IRPointerType, IRTemporary, isSynthesizable, Synthesizable } from "../generator/IR";
import { AllConstraint, AnyClassConstraint, OutgoingConstraint } from "../typemath/Signature";
import { ASTElement } from "./ASTElement";
import { ClassType } from "./TypeObject";


export class FieldReferenceExpression extends ASTElement implements Synthesizable {
    source: ASTElement;
    field: string;

    constructor(parent: ASTElement, source: ASTElement, field: string) {
        super(parent);
        this.source = source;
        this.field = field;

        this.signature.ports.add("value");
        this.signature.ports.add("source");
        this.signature.type_constraints.set("value", new AllConstraint("value"));
        this.signature.port_constraints.push(new OutgoingConstraint("source", new AnyClassConstraint("value")));
    }

    toString = () => `${this.source.toString()}.${this.field}`;
    index(): number {
        const vt = this.source.singleValueType();
        if (vt instanceof ClassType) {
            return vt.source.fields.findIndex(x => x.name == this.field);
        }
        return -1;
    }

    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if (this._ir_block) return this._ir_block;
        if (!isSynthesizable(this.source)) throw new Error("attempted to synthesize FieldReferenceExpression of non-synthesizable");
        const source_block = this.source.synthesize();
        const temp = new IRTemporary();
        const temp2 = new IRTemporary();
        return this._ir_block = {
            output_location: {
                type: new IRPointerType(this.computed_type.toIR()),
                location: temp2
            },
            statements: [
                new IRLoad({ type: (source_block.output_location.type as IRPointerType).sub, location: temp }, source_block.output_location),
                new GEPStructStatement({ type: new IRPointerType(this.computed_type.toIR()), location: temp2 }, { type: (source_block.output_location.type as IRPointerType).sub, location: temp }, this.index())
            ],
            sub_blocks: [source_block]
        };
    }
}
