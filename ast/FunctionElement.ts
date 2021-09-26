import { Scope } from "../type_inference/Scope";
import { Type, UnitType, VoidType } from "../type_inference/Type";
import { ASTElement, SourceLocation } from "./ASTElement";
import { CompoundStatementElement } from "./CompoundStatementElement";
import { TypedItemElement } from "./TypedItemElement";

export class FunctionElement extends ASTElement {
    fqn: string[];
    return_type: Type;
    self_type: Type;
    args: TypedItemElement[];
    body: CompoundStatementElement;
    scope: Scope;

    constructor(loc: SourceLocation, fqn: string[], type: Type, self_type: Type, args: TypedItemElement[], body: CompoundStatementElement) {
        super(loc);
        this.fqn = fqn;
        if (type instanceof UnitType && type.name == "void") type = new VoidType();
        this.return_type = type;
        this.self_type = self_type;
        this.args = args;
        this.body = body;
    }

    addScope(s: Scope) {
        this.scope = s;
    }

    toString() {
        return `FunctionElement(${this.fqn.join(".")}, ${this.return_type}, ${this.args}, ${this.body})`;
    }

    clone() {
        const rc = new FunctionElement(
            this.source_location,
            [...this.fqn],
            this.return_type,
            this.self_type,
            this.args.map(x => x.clone()),
            this.body.clone()
        );
        if (this.scope) rc.addScope(this.scope.clone());
        return rc;
    }
}
