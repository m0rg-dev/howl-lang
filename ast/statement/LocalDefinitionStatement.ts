import { Type } from "../../type_inference/Type";
import { SourceLocation } from "../ASTElement";
import { StatementElement } from "../StatementElement";


export class LocalDefinitionStatement extends StatementElement {
    name: string;
    type: Type;

    constructor(loc: SourceLocation, name: string, type: Type) {
        super(loc);
        this.name = name;
        this.type = type;
    }

    clone() {
        return new LocalDefinitionStatement(this.source_location, this.name, this.type);
    }

    toString() {
        return `let ${this.type} ${this.name}`;
    }
}
