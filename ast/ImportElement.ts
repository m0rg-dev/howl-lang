import { ASTElement, SourceLocation } from "./ASTElement";


export class ImportElement extends ASTElement {
    name: string;

    constructor(loc: SourceLocation, name: string) {
        super(loc);
        this.name = name;
    }

    clone(): ImportElement {
        return new ImportElement([...this.source_location], this.name);
    }

    toString(): string {
        return `Import(${this.name})`;
    }
}
