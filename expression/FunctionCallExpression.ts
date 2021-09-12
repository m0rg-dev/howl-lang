import { FunctionType, PointerType } from "../generator/TypeRegistry";
import { InferSubField } from "./ExpressionParser";
import { Expression } from "./Expression";
import { count } from "../generator/Synthesizable";


export class FunctionCallExpression extends Expression {
    rhs: Expression;
    type: PointerType;
    args: Expression[];

    constructor(rhs: Expression, type: PointerType, args: Expression[]) {
        super();
        this.rhs = rhs;
        this.type = type;
        this.args = args;
    }

    valueType = () => (this.type.get_sub() as FunctionType).return_type();
    toString = () => `FunctionCall<${this.valueType().to_readable()}>(${this.rhs.toString()}, (${this.args.map(x => x.toString()).join(", ")}))`;
    inferTypes = () => {
        InferSubField(this.rhs, (n: Expression) => this.rhs = n);
        this.args.map((x, i) => InferSubField(x, (n: Expression) => this.args[i] = n));
    };

    synthesize(): { code: string; location: string; } {
        let s = `${super.synthesize().code}\n`;
        const rhs = this.rhs.synthesize();
        const args = this.args.map(x => x.synthesize());

        s += `    ${rhs.code}\n`;
        args.forEach(x => s += `    ${x.code}\n`);
        s += `    ;; rhs: ${rhs.location} ${this.rhs.valueType().to_ir()}*\n`;
        const fptr = `%${count()}`;
        s += `    ${fptr} = load ${this.rhs.valueType().to_ir()}, ${this.rhs.valueType().to_ir()}* ${rhs.location}\n`;
        const arg_loads = args.map(x => `%${count()}`);
        for(const idx in this.args) {
            s += `    ${arg_loads[idx]} = load ${this.args[idx].valueType().to_ir()}, ${this.args[idx].valueType().to_ir()}* ${args[idx].location}\n`;
        }
        s += `    call ${this.valueType().to_ir()} ${fptr}(${this.args.map((x, y) => `${x.valueType().to_ir()} ${arg_loads[y]}`).join(", ")})`;
        return { code: s, location: "%INVALID" };
    }
}
