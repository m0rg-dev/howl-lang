import { IRAlloca, IRBlock, IRNumericLiteral, IRPointerType, IRStore, IRTemporary, Synthesizable } from "../generator/IR";
import { GetType } from "../registry/TypeRegistry";
import { UnionConstraint } from "../typemath/Signature";
import { ASTElement } from "./ASTElement";

export class NumericLiteralExpression extends ASTElement implements Synthesizable {
    value: number;
    constructor(parent: ASTElement, value: number) {
        super(parent);
        this.value = value;

        this.signature.ports.add("value");
        this.signature.type_constraints.set("value", new UnionConstraint("value", [
            GetType("i64"),
            GetType("i32"),
            GetType("i8")
        ]));
    }
    toString = () => `#${this.value}`;

    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if (this._ir_block) return { output_location: this._ir_block.output_location, statements: [] };

        const out = new IRTemporary();
        return this._ir_block = {
            output_location: {
                type: new IRPointerType(this.computed_type),
                location: out
            },
            statements: [
                new IRAlloca({ type: new IRPointerType(this.computed_type), location: out }),
                new IRStore({ type: this.computed_type, location: new IRNumericLiteral(this.value) },
                    { type: new IRPointerType(this.computed_type), location: out })
            ]
        };
    }
}
