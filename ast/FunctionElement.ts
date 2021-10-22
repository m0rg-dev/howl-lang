import { CompilationUnit } from "../driver/CompilationUnit";
import { Scope } from "../type_inference/Scope";
import { Type } from "../type_inference/Type";
import { VoidType } from "../type_inference/VoidType";
import { ASTElement, SourceLocation } from "./ASTElement";
import { CompoundStatementElement } from "./CompoundStatementElement";
import { TypedItemElement } from "./TypedItemElement";

export class FunctionElement extends ASTElement {
    parent: string;
    name: string;

    source: CompilationUnit;

    return_type: Type;
    self_type: Type;
    args: TypedItemElement[];
    throws: Type[];
    body: CompoundStatementElement;
    scope: Scope;
    is_static: boolean;
    is_overload: boolean;
    original_name: string;

    constructor(loc: SourceLocation, parent: string, name: string, return_type: Type, self_type: Type, args: TypedItemElement[], throws: Type[], is_static: boolean, body: CompoundStatementElement, source: CompilationUnit) {
        super(loc);
        if (name.includes(".")) {
            const parts = name.split(".");
            name = parts.pop();
            parent += "." + parts.join(".");
        }

        this.name = name;
        this.parent = parent;
        this.return_type = return_type;
        this.self_type = self_type || new VoidType();
        this.args = args;
        this.throws = throws;
        this.body = body;
        this.is_static = is_static;
        this.source = source;

        this.is_overload = false;
        this.original_name = name;
    }

    addScope(s: Scope) {
        this.scope = s;
    }

    toString() {
        return `FunctionElement(${this.parent}.${this.name}, ${this.return_type}, ${this.args}, ${this.body})${this.throws.map(x => ` throws ${x}`).join(" ")}`;
    }

    clone() {
        const rc = new FunctionElement(
            this.source_location,
            this.parent,
            this.name,
            this.return_type,
            this.self_type,
            this.args.map(x => x.clone()),
            [...this.throws],
            this.is_static,
            this.body.clone(),
            this.source
        );
        if (this.scope) rc.addScope(this.scope.clone());
        if (this.original_name) rc.original_name = this.original_name;
        return rc;
    }

    full_name(): string {
        return this.parent + "." + this.name;
    }
}

export class OverloadedFunctionElement extends FunctionElement {
    static make(from: FunctionElement) {
        const rc = new OverloadedFunctionElement(
            from.source_location,
            from.parent,
            from.name,
            from.return_type,
            from.self_type,
            [],
            [],
            from.is_static,
            undefined,
            from.source
        );
        return rc;
    }

    clone() {
        const rc = new OverloadedFunctionElement(
            this.source_location,
            this.parent,
            this.name,
            this.return_type,
            this.self_type,
            this.args.map(x => x.clone()),
            [...this.throws],
            this.is_static,
            undefined,
            this.source
        );
        return rc;
    }

    toString() {
        return `OverloadedFunctionElement(${this.name}, ${this.return_type}, ${this.args}, ${this.body})`;
    }
}