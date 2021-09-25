import { GenericType, Type } from "../type_inference/Type";
import { SourceLocation } from "./ASTElement";
import { TypeElement } from "./TypeElement";

export class GenericElement extends TypeElement {
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
