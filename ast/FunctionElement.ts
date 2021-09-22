import { ASTElement, SourceLocation } from "./ASTElement";
import { CompoundStatementElement } from "./CompoundStatementElement";
import { PartialArgumentListElement } from "./PartialArgumentListElement";
import { Scope } from "./Scope";
import { SignatureElement } from "./SignatureElement";

export class FunctionElement extends ASTElement {
    name: string;
    type: SignatureElement;
    args: PartialArgumentListElement;
    body: CompoundStatementElement;
    scope: Scope;

    constructor(loc: SourceLocation, name: string, type: SignatureElement, args: PartialArgumentListElement, body: CompoundStatementElement) {
        super(loc);
        this.name = name;
        this.type = type;
        this.args = args;
        this.body = body;
        this.scope = new Scope(this, undefined);
        this.scope.addName("__return");
        this.scope.addName("self");
        this.type.expressions.forEach(x => this.scope.addType(x));
    }

    toString() {
        return `FunctionElement(${this.name}, ${this.type}, ${this.args}, ${this.body})`;
    }

    clone() {
        return new FunctionElement(
            this.source_location,
            this.name,
            this.type.clone(),
            this.args.clone(),
            this.body.clone()
        );
    }
}
