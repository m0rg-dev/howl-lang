import { Type } from "../type_inference/Type";
import { ASTElement, SourceLocation } from "./ASTElement";
import { CompoundStatementElement } from "./CompoundStatementElement";
import { NameElement } from "./NameElement";
import { PartialArgumentListElement } from "./PartialArgumentListElement";
import { Scope } from "../type_inference/Scope";
import { TypedItemElement } from "./TypedItemElement";

export class FunctionElement extends ASTElement {
    name: string;
    type: Type;
    self_type: Type;
    args: TypedItemElement[];
    body: CompoundStatementElement;
    scope: Scope;

    constructor(loc: SourceLocation, name: string, type: Type, self_type: Type, args: TypedItemElement[], body: CompoundStatementElement) {
        super(loc);
        this.name = name;
        this.type = type;
        this.self_type = self_type;
        this.args = args;
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
            this.type,
            this.self_type,
            this.args.map(x => x.clone()),
            this.body.clone()
        );
        if (this.scope) rc.addScope(this.scope.clone());
        return rc;
    }
}
