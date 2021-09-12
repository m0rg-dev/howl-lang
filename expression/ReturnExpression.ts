import { count } from "../generator/Synthesizable";
import { TypeRegistry } from "../generator/TypeRegistry";
import { Expression } from "./Expression";
import { InferSubField, VoidExpression } from "./ExpressionParser";


export class ReturnExpression extends Expression {
    sub: Expression;

    constructor(sub: Expression) {
        super();
        this.sub = sub;
    }

    valueType = () => TypeRegistry.get("void");
    toString = () => `Return(${this.sub.toString()})`;
    inferTypes = () => {
        InferSubField(this.sub, (n: Expression) => this.sub = n);
    };

    synthesize(): { code: string; location: string; } {
        let s = `${super.synthesize().code}\n`;
        if (this.sub instanceof VoidExpression) {
            s += `    ret void`;
        } else {
            const sub = this.sub.synthesize();
            s += `    ${sub.code}\n`;
            const ptr = `%${count()}`;
            s += `    ${ptr} = load ${this.sub.valueType().to_ir()}, ${this.sub.valueType().to_ir()}* ${sub.location}\n`;
            s += `    ret ${this.sub.valueType().to_ir()} ${ptr}`;
        }

        return { code: s, location: "%INVALID" };
    }
}
