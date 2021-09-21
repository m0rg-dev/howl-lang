import { ASTElement, SourceLocation } from "./ASTElement";


export class SyntaxErrorElement extends ASTElement {
    description: string;

    constructor(loc: SourceLocation, description: string) {
        super(loc);
        this.description = description;
    }

    clone(): SyntaxErrorElement {
        return new SyntaxErrorElement([...this.source_location], this.description);
    }

    toString(): string {
        return `SyntaxError("${this.description}")`;
    }
}
