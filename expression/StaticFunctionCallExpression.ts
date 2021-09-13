import { FunctionType } from "../generator/TypeRegistry";
import { Expression } from "../expression/Expression";
import { InferSubField } from "./ExpressionParser";


export class StaticFunctionCallExpression extends Expression {
    name: string;
    type: FunctionType;
    args: Expression[];

    constructor(name: string, type: FunctionType, args: Expression[]) {
        super();
        this.name = name;
        this.type = type;
        this.args = args;
    }
    valueType = () => this.type.return_type();
    toString = () => `StaticFunctionCall<${this.valueType().to_readable()}>(${this.name}, (${this.args.map(x => x.toString()).join(", ")}))`;
    inferTypes = () => {
        this.args.map((x, i) => InferSubField(x, (n: Expression) => this.args[i] = n));
    };
}
