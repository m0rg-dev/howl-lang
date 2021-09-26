import { Scope } from "../type_inference/Scope";
import { Type } from "../type_inference/Type";
import { VoidType } from "../type_inference/VoidType";
import { ConcreteType } from "../type_inference/ConcreteType";
import { ASTElement, SourceLocation } from "./ASTElement";
import { CompoundStatementElement } from "./CompoundStatementElement";
import { FQN, HasFQN } from "./FQN";
import { TypedItemElement } from "./TypedItemElement";

export class FunctionElement extends ASTElement implements HasFQN {
    private parent: HasFQN;
    private name: string;

    return_type: Type;
    self_type: Type;
    args: TypedItemElement[];
    body: CompoundStatementElement;
    scope: Scope;

    constructor(loc: SourceLocation, parent: HasFQN, name: string, return_type: Type, self_type: Type, args: TypedItemElement[], body: CompoundStatementElement) {
        super(loc);
        this.name = name;
        this.parent = parent;
        if (return_type instanceof ConcreteType && return_type.name == "void") return_type = new VoidType();
        this.return_type = return_type;
        this.self_type = self_type;
        this.args = args;
        this.body = body;
    }

    addScope(s: Scope) {
        this.scope = s;
    }

    toString() {
        return `FunctionElement(${this.getFQN()}, ${this.return_type}, ${this.args}, ${this.body})`;
    }

    clone() {
        const rc = new FunctionElement(
            this.source_location,
            this.parent,
            this.name,
            this.return_type,
            this.self_type,
            this.args.map(x => x.clone()),
            this.body.clone()
        );
        if (this.scope) rc.addScope(this.scope.clone());
        return rc;
    }

    getFQN() {
        return new FQN(this.parent, this.name);
    }

    setParent(p: HasFQN) {
        this.parent = p;
    }
}
