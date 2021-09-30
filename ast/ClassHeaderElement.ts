import { ASTElement, SourceLocation } from "./ASTElement";

export class ClassHeaderElement extends ASTElement {
    name: string;
    generics: string[];

    constructor(loc: SourceLocation, name: string, generics: string[]) {
        super(loc);
        this.name = name;
        this.generics = generics;
    }

    clone() {
        return new ClassHeaderElement(this.source_location, this.name, [...this.generics]);
    }

    toString() {
        return `ClassHeader<${this.generics.join(", ")}>(${this.name})`;
    }
}
