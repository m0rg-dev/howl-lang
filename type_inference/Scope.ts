import { randomUUID } from "crypto";
import { Type } from "./Type";
import { TypeLocation } from "./TypeLocation";
import { FunctionElement } from "../ast/FunctionElement";

var scope_index = 0;

export class Scope {
    uuid: string;
    n: number;
    root: FunctionElement;
    parent: Scope;

    names: string[] = [];
    types: Type[] = [];

    gc_temp: Set<number> = new Set();

    constructor(root: FunctionElement, parent: Scope) {
        this.uuid = randomUUID().replaceAll("-", "_");
        this.root = root;
        this.parent = parent;

        this.n = scope_index++;
    }


    addType(type: Type, name?: string): number {
        const idx = this.types.push(type) - 1;
        this.names[idx] = name;
        return idx;
    }

    clone(): Scope {
        const rc = new Scope(this.root, this.parent);

        rc.names = [...this.names];
        rc.types = [...this.types];
        rc.n = this.n;

        return rc;
    }

    lookupName(name: string): TypeLocation {
        const idx = this.names.indexOf(name);
        if (idx < 0) return this.parent?.lookupName(name);
        return new TypeLocation(this, idx);
    }
}
