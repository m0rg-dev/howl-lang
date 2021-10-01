import { CompilationUnit } from "../driver/CompilationUnit";
import { Scope } from "../type_inference/Scope";
import { Type } from "../type_inference/Type";
import { VoidType } from "../type_inference/VoidType";
import { ASTElement, SourceLocation } from "./ASTElement";
import { CompoundStatementElement } from "./CompoundStatementElement";
import { FQN, HasFQN } from "./FQN";
import { TypedItemElement } from "./TypedItemElement";

export class FunctionElement extends ASTElement {
    private parent: HasFQN;
    name: string;

    source: CompilationUnit;

    return_type: Type;
    self_type: Type;
    args: TypedItemElement[];
    body: CompoundStatementElement;
    scope: Scope;
    is_static: boolean;

    constructor(loc: SourceLocation, parent: HasFQN, name: string, return_type: Type, self_type: Type, args: TypedItemElement[], is_static: boolean, body: CompoundStatementElement, source: CompilationUnit) {
        super(loc);
        this.name = name;
        this.parent = parent;
        this.return_type = return_type;
        this.self_type = self_type || new VoidType();
        this.args = args;
        this.body = body;
        this.is_static = is_static;
        this.source = source;
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
            this.is_static,
            this.body.clone(),
            this.source
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
