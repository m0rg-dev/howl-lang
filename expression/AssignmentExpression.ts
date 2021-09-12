import { TypeRegistry } from "../generator/TypeRegistry";
import { Expression } from "./Expression";
import { FieldReferenceExpression } from "./FieldReferenceExpression";
import { VariableExpression } from "./VariableExpression";
import { InferSubField } from "./ExpressionParser";
import { count } from "../generator/Synthesizable";


export class AssignmentExpression extends Expression {
    lhs: VariableExpression | FieldReferenceExpression;
    rhs: Expression;

    constructor(lhs: VariableExpression | FieldReferenceExpression, rhs: Expression) {
        super();
        this.lhs = lhs;
        this.rhs = rhs;
    }

    valueType = () => TypeRegistry.get("void");
    toString(): string {
        return `Assignment(${this.lhs.toString()} = ${this.rhs.toString()})`;
    }
    inferTypes = () => {
        InferSubField(this.lhs, (n: VariableExpression | FieldReferenceExpression) => this.lhs = n);
        InferSubField(this.rhs, (n: Expression) => this.rhs = n);
    };

    synthesize(): { code: string; location: string; } {
        let s = `${super.synthesize().code}\n`;
        const lhs = this.lhs.synthesize();
        const rhs = this.rhs.synthesize();

        s += `    ${lhs.code}\n`;
        s += `    ${rhs.code}\n`;
        const val = `%${count()}`;
        s += `    ${val} = load ${this.rhs.valueType().to_ir()}, ${this.rhs.valueType().to_ir()}* ${rhs.location}\n`;
        s += `    store ${this.rhs.valueType().to_ir()} ${val}, ${this.lhs.valueType().to_ir()}* ${lhs.location}`;
        return { code: s, location: '%INVALID' };
    }
}
