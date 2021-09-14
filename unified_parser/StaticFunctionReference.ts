import { ASTElement } from "./ASTElement";
import { FunctionType } from "./TypeObject";

export class StaticFunctionReference extends ASTElement {
    name: string;

    constructor(name: string, type: FunctionType) {
        super(type);
        this.name = name;
    }

    toString = () => `statfn<${this.value_type}> ${this.name}`;
}