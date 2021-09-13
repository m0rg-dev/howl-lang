import { count } from "../generator/Synthesizable";
import { PointerType } from "../generator/TypeRegistry";
import { Expression } from "./Expression";
import { InferSubField } from "../unified_parser/ExpressionParser";


export class DereferenceExpression extends Expression {
    sub: Expression;

    constructor(sub: Expression) {
        super();
        this.sub = sub;
    }

    valueType = () => (this.sub.valueType() as PointerType).get_sub();
    toString = () => `Dereference<${this.valueType().to_readable()}>(${this.sub.toString()})`;
    inferTypes = () => {
        InferSubField(this.sub, (n: Expression) => this.sub = n);
    };

    synthesize(): { code: string; location: string; } {
        let s = `${super.synthesize().code}\n`;
        const sub = this.sub.synthesize();
        s += `    ${sub.code}\n`;
        const ptr = `%${count()}`;
        s += `    ${ptr} = load ${this.valueType().to_ir()}*, ${this.sub.valueType().to_ir()}* ${sub.location}`;

        return { code: s, location: ptr };
    }
}
