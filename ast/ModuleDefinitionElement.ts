import { ASTElement, SourceLocation } from "./ASTElement";
import { FQN, HasFQN } from "./FQN";


export class ModuleDefinitionElement extends ASTElement implements HasFQN {
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

    getFQN() {
        return new FQN(undefined, this.name);
    }
}
