import { ASTElement, SourceLocation } from "./ASTElement";
import { Scope } from "../type_inference/Scope";

export class CompoundStatementElement extends ASTElement {
    statements: ASTElement[];
    scope: Scope;

    constructor(loc: SourceLocation, statements: ASTElement[], scope: Scope) {
        super(loc);
        this.statements = statements;
        this.scope = scope;
    }

    addScope(s: Scope) {
        this.scope = s;
    }

    toString() {
        return `CompoundStatement(${this.statements.length})`;
    }

    clone() {
        return new CompoundStatementElement(
            this.source_location,
            (this.statements.map(x => x.clone()) as ASTElement[]),
            this.scope.clone()
        );
    }
}