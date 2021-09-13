import { VariableExpression } from "../expression/VariableExpression";


export class StaticFunctionReferenceExpression extends VariableExpression {
    toString = () => `StaticFunctionReference<${this.type.to_readable()}(${this.name})`;
}
