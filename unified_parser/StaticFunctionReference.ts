import { ASTElement } from "./ASTElement";
import { FunctionType } from "./TypeObject";

export class StaticFunctionReference extends ASTElement {
    name: string;
    field_type: FunctionType;

    constructor(parent: ASTElement, name: string, type: FunctionType) {
        super(parent);
        this.name = name;
        this.field_type = type;
    }

    toString = () => `statfn<${this.field_type}> ${this.name}`;
}