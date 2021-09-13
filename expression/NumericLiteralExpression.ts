import { count } from "../generator/Synthesizable";
import { Type, TypeRegistry } from "../generator/TypeRegistry";
import { ProviderType } from "../unified_parser/ExpressionParser";
import { Expression } from "./Expression";
import { Specifiable } from "./Specifiable";

export class NumericLiteralExpression extends Expression implements Specifiable {
    value: number;
    type: Type;

    constructor(value: number) {
        super();
        this.value = value;
        this.type = new ProviderType([
            TypeRegistry.get("i8"),
            TypeRegistry.get("i32"),
        ]);
    }

    valueType = () => this.type;
    toString = () => `NumericLiteral<${this.valueType().to_readable()}>(${this.value})`;
    specify(target: Type): Expression {
        // TODO check target in this.type
        const rc = new NumericLiteralExpression(this.value);
        rc.type = target;
        return rc;
    }
    inferTypes = () => { };

    synthesize(): { code: string; location: string; } {
        let s = `${super.synthesize().code}\n`;
        const ptr = `%${count()}`;
        s += `    ${ptr} = alloca ${this.type.to_ir()}\n`;
        s += `    store ${this.type.to_ir()} ${this.value}, ${this.type.to_ir()}* ${ptr}`;

        return { code: s, location: ptr };
    }
}
