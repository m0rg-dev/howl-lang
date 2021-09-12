import { Type } from "../generator/TypeRegistry";
import { Expression } from "./Expression";


export class VariableExpression extends Expression {
    name: string;
    type: Type;

    constructor(name: string, type: Type) {
        super();
        this.name = name;
        this.type = type;
    }

    valueType = () => this.type;
    toString(): string {
        return `Variable<${this.type.to_readable()}>(${this.name})`;
    }
    inferTypes = () => { };
    synthesize(): { code: string; location: string; } {
        return { code: "", location: `%${this.name}` };
    }
}
