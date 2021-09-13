import { Type } from "../generator/TypeRegistry";
import { Expression } from "./Expression";
import { InferSubField } from "../unified_parser/ExpressionParser";


export class SpecifyExpression extends Expression {
    sub: Expression;
    type: Type;

    constructor(sub: Expression, type: Type) {
        super();
        this.sub = sub;
        this.type = type;
    }

    valueType = () => this.type;
    toString = () => `Specify<${this.type.to_readable()}>(${this.sub.toString()})`;
    inferTypes = () => {
        InferSubField(this.sub, (n: Expression) => this.sub = n);
    };
}
