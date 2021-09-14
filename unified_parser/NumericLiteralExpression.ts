import { IRAlloca, IRBlock, IRNumericLiteral, IRPointerType, IRSomethingElse, IRStore, IRTemporary, Synthesizable } from "../generator/IR";
import { TypeRegistry } from "../registry/TypeRegistry";
import { ASTElement } from "./ASTElement";


export class NumericLiteralExpression extends ASTElement implements Synthesizable {
    value: number;
    constructor(value: number) {
        super(TypeRegistry.get("_numeric_constant"));
        this.value = value;
    }
    toString = () => `#${this.value}`;

    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if (this._ir_block) return this._ir_block;

        const out = new IRTemporary();
        return this._ir_block = {
            output_location: {
                type: new IRPointerType(this.value_type),
                location: out
            },
            statements: [
                new IRAlloca({ type: new IRPointerType(this.value_type), location: out }),
                new IRStore({ type: this.value_type, location: new IRNumericLiteral(this.value) },
                    { type: new IRPointerType(this.value_type), location: out })
            ]
        };
    }
}
