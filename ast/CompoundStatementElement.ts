import { ASTElement, SourceLocation } from "./ASTElement";
import { Scope } from "./Scope";
import { SignatureElement } from "./SignatureElement";

export class CompoundStatementElement extends ASTElement {
    type: SignatureElement;
    statements: ASTElement[];
    scope: Scope;

    constructor(loc: SourceLocation, type: SignatureElement, statements: ASTElement[], scope: Scope) {
        super(loc);
        this.type = type;
        this.statements = statements;
        this.scope = scope;
    }

    addScope(s: Scope) {
        this.scope = s;
    }

    toString() {
        return `CompoundStatement(${this.type}, ...${this.statements.length})`;
    }

    clone() {
        return new CompoundStatementElement(
            this.source_location,
            this.type.clone(),
            (this.statements.map(x => x.clone()) as ASTElement[]),
            this.scope.clone()
        );
    }
}