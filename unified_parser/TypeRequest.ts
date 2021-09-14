import { ASTElement } from "./ASTElement";
import { TypeObject } from "./TypeObject";

export class TypeRequest extends ASTElement {
    source: ASTElement;

    constructor(parent: ASTElement, source: ASTElement, type: TypeObject) {
        super(type, parent);
        this.source = source;
    }

    toString = () => `as ${this.value_type}`;
}