import { ASTElement } from "./ASTElement";
import { FunctionType } from "./TypeObject";

export class StaticFunctionReference extends ASTElement {
    name: string;

    constructor(parent: ASTElement, name: string, type: FunctionType) {
        super(type, parent);
        this.name = name;
    }

    toString = () => `statfn<${this.value_type}> ${this.name}`;
}