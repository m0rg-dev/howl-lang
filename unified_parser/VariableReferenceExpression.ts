import { TypeObject } from "./TypeObject";
import { ASTElement } from "./ASTElement";
import { IRAlloca, IRBlock, IRNamedIdentifier, IRPointerType, IRStore, IRTemporary, Synthesizable } from "../generator/IR";


export class VariableReferenceExpression extends ASTElement implements Synthesizable {
    name: string;
    force_local: boolean;

    constructor(parent: ASTElement, type: TypeObject, name: string) {
        super(type, parent);
        this.name = name;
    }

    toString = () => `var ${this.name}`;

    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if (this._ir_block) return this._ir_block;

        if (!(this.force_local) && this.isStatic(this.name)) {
            const temp = new IRTemporary();
            return {
                output_location: {
                    type: new IRPointerType(this.value_type.toIR()),
                    location: temp
                },
                statements: [
                    new IRAlloca(
                        { type: new IRPointerType(this.value_type.toIR()), location: temp }
                    ),
                    new IRStore(
                        { type: this.value_type.toIR(), location: `@${this.name}` },
                        { type: new IRPointerType(this.value_type.toIR()), location: temp }
                    )
                ]
            };
        } else {
            return {
                output_location: {
                    type: new IRPointerType(this.value_type.toIR()),
                    location: new IRNamedIdentifier(`%${this.name}`)
                },
                statements: []
            };
        }
    }
}
