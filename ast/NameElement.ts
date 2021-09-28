import { ASTElement, SourceLocation } from "./ASTElement";
import { Scope } from "../type_inference/Scope";

export class NameElement extends ASTElement {
    name: string;

    constructor(loc: SourceLocation, name: string) {
        super(loc);
        this.name = name;
    }

    toString() {
        return `@${this.name}`;
    }

    clone() {
        return new NameElement(this.source_location, this.name);
    }
}
