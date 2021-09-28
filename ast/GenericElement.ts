import { Type } from "../type_inference/Type";
import { GenericType } from "../type_inference/GenericType";
import { SourceLocation } from "./ASTElement";
import { SimpleTypeElement } from "./TypeElement";

export class GenericElement extends SimpleTypeElement {
    constructor(loc: SourceLocation, name: string) {
        super(loc, name);
    }

    toString() {
        return `GE(${this.name})`;
    }

    clone() {
        return new GenericElement(this.source_location, this.name);
    }

    asTypeObject(): Type {
        return new GenericType(this.name);
    }
}
