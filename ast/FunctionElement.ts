import { ASTElement, SourceLocation } from "./ASTElement";
import { CompoundStatementElement } from "./CompoundStatementElement";
import { NameElement } from "./NameElement";
import { PartialArgumentListElement } from "./PartialArgumentListElement";
import { Scope } from "./Scope";
import { SignatureElement } from "./SignatureElement";

export class FunctionElement extends ASTElement {
    name: string;
    type: SignatureElement;
    args: string[];
    body: CompoundStatementElement;
    scope: Scope;

    constructor(loc: SourceLocation, name: string, type: SignatureElement, args: PartialArgumentListElement, body: CompoundStatementElement) {
        super(loc);
        this.name = name;
        this.type = type;
        // TODO
        this.args = args.body.filter(x => x instanceof NameElement).map(x => x['name']);
        this.body = body;
    }

    addScope(s: Scope) {
        this.scope = s;
    }

    toString() {
        return `FunctionElement(${this.name}, ${this.type}, ${this.args}, ${this.body})`;
    }

    clone() {
        const rc = new FunctionElement(
            this.source_location,
            this.name,
            this.type.clone(),
            undefined,
            this.body.clone()
        );
        if (this.scope) rc.addScope(this.scope.clone());
        return rc;
    }
}
