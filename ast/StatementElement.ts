import { ASTElement, SourceLocation } from "./ASTElement";

export abstract class StatementElement extends ASTElement { }

export class PartialStatementElement extends StatementElement {
    body: ASTElement[];

    constructor(loc: SourceLocation, body: ASTElement[]) {
        super(loc);
        this.body = [...body];
    }

    clone() {
        return new PartialStatementElement(this.source_location, this.body.map(x => x.clone()) as ASTElement[]);
    }

    toString() {
        return `PartialStatement(${this.body.map(x => x.toString()).join(" ")})`;
    }
}

