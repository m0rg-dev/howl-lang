import { randomUUID } from "crypto";
import { Type, TypeLocation } from "../type_inference/Type";
import { TypeConstraint } from "../type_inference/TypeConstraint";
import { FunctionElement } from "./FunctionElement";

var scope_index = 0;

export class Scope {
    uuid: string;
    n: number;
    root: FunctionElement;
    parent: Scope;

    names: string[] = [];
    types: Type[] = [];
    constraints: TypeConstraint[] = [];

    constructor(root: FunctionElement, parent: Scope) {
        this.uuid = randomUUID().replaceAll("-", "_");
        this.root = root;
        this.parent = parent;

        this.n = scope_index++;
    }

    addName(name: string) {
        this.names.push(name);
    }

    addType(type: Type): number {
        return this.types.push(type) - 1;
    }

    clone(): Scope {
        const rc = new Scope(this.root, this.parent);
        this.names.forEach(x => rc.addName(x));
        this.types.forEach(x => rc.addType(x));
        return rc;
    }

    lookupName(name: string): TypeLocation {
        const idx = this.names.indexOf(name);
        if (idx < 0) return this.parent?.lookupName(name);
        return new TypeLocation(this, idx);
    }
}
