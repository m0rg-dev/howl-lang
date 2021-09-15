import { ASTElement } from "./ASTElement";
import { TypeObject } from "./TypeObject";

export class TypeRequest extends ASTElement {
    source: ASTElement;
    field_type: TypeObject;

    constructor(parent: ASTElement, source: ASTElement, type: TypeObject) {
        super(parent);
        this.source = source;
        this.field_type = type;
    }

    toString = () => `as ${this.field_type}`;
}