import { TypeObject } from "./TypeObject";
import { ASTElement } from "./ASTElement";
import { IRAlloca, IRBlock, IRNamedIdentifier, IRPointerType, IRStore, IRTemporary, Synthesizable } from "../generator/IR";
import { FromScopeConstraint } from "../typemath/Signature";


export class VariableReferenceExpression extends ASTElement implements Synthesizable {
    name: string;
    force_local: boolean;

    constructor(parent: ASTElement, name: string) {
        super(parent);
        console.error(`[VRE CONSTRUCTOR] ${this.guid}`);
        this.name = name;

        this.signature.ports.add("value");
        this.signature.type_constraints.set("value", new FromScopeConstraint("value", name));
    }

    toString = () => `var ${this.name}`;

    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if (this._ir_block) return { output_location: this._ir_block.output_location, statements: [] };

        if (!(this.force_local) && this.isStatic(this.name)) {
            const temp = new IRTemporary();
            return {
                output_location: {
                    type: new IRPointerType(this.computed_type.toIR()),
                    location: temp
                },
                statements: [
                    new IRAlloca(
                        { type: new IRPointerType(this.computed_type.toIR()), location: temp }
                    ),
                    new IRStore(
                        { type: this.computed_type.toIR(), location: `@${this.name}` },
                        { type: new IRPointerType(this.computed_type.toIR()), location: temp }
                    )
                ]
            };
        } else {
            return {
                output_location: {
                    type: new IRPointerType(this.computed_type.toIR()),
                    location: new IRNamedIdentifier(`%${this.name}`)
                },
                statements: []
            };
        }
    }
}
