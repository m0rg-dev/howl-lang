import { ASTElement, SourceLocation } from "./ASTElement";

export class ClassHeaderElement extends ASTElement {
    name: string;
    generics: string[];
    parent: string;

    constructor(loc: SourceLocation, name: string, generics: string[], parent: string) {
        super(loc);
        this.name = name;
        this.generics = generics;
        this.parent = parent;
    }

    clone() {
        return new ClassHeaderElement(this.source_location, this.name, [...this.generics], this.parent);
    }

    toString() {
        return `ClassHeader<${this.generics.join(", ")}>(${this.name})${this.parent ? ` extends ${this.parent}` : ""}`;
    }
}
