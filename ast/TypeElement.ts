import { ASTElement, SourceLocation } from "./ASTElement";

export class TypeElement extends ASTElement {
    name: string;

    constructor(loc: SourceLocation, name: string) {
        super(loc);
        this.name = name;
    }

    toString() {
        return `TE(${this.name})`;
    }

    clone() {
        return new TypeElement(this.source_location, this.name);
    }
}
