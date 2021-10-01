import { Type } from "../type_inference/Type";
import { ASTElement, SourceLocation } from "./ASTElement";
import { TypeElement } from "./TypeElement";

export class TypedItemElement extends ASTElement {
    name: string;
    type: TypeElement;

    constructor(loc: SourceLocation, name: string, type: TypeElement) {
        super(loc);
        this.name = name;
        this.type = type;
    }

    toString() {
        return `${this.type} ${this.name}`;
    }

    clone() {
        return new TypedItemElement(this.source_location, this.name, this.type.clone());
    }
}
