import { ASTElement, SourceLocation } from "./ASTElement";
import { SignatureElement } from "./SignatureElement";

export class CompoundStatementElement extends ASTElement {
    type: SignatureElement;
    statements: ASTElement[];

    constructor(loc: SourceLocation, type: SignatureElement, statements: ASTElement[]) {
        super(loc);
        this.type = type;
        this.statements = statements;
    }

    toString() {
        return `CompoundStatement(${this.type}, ...${this.statements.length})`;
    }

    clone() {
        return new CompoundStatementElement(
            this.source_location,
            this.type.clone(),
            (this.statements.map(x => x.clone()) as ASTElement[])
        );
    }
}