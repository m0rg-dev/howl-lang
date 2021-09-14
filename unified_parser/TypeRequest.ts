import { ASTElement } from "./ASTElement";
import { TypeObject } from "./TypeObject";

export class TypeRequest extends ASTElement {
    source: ASTElement;

    constructor(source: ASTElement, type: TypeObject) {
        super(type);
        this.source = source;
    }

    toString = () => `as ${this.value_type}`;
}