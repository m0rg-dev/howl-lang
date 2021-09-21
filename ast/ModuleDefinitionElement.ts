import { ASTElement, SourceLocation } from "./ASTElement";


export class ModuleDefinitionElement extends ASTElement {
    name: string;

    constructor(loc: SourceLocation, name: string) {
        super(loc);
        this.name = name;
    }

    clone(): ModuleDefinitionElement {
        return new ModuleDefinitionElement([...this.source_location], this.name);
    }

    toString(): string {
        return `Module(${this.name})`;
    }
}
