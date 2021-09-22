import { randomUUID } from "crypto";
import { FunctionElement } from "./FunctionElement";
import { TypeExpressionElement } from "./TypeExpressionElement";

export class Scope {
    uuid: string;
    root: FunctionElement;
    parent: Scope;

    names: string[] = [];
    types: TypeExpressionElement[] = [];

    constructor(root: FunctionElement, parent: Scope) {
        this.uuid = randomUUID().replaceAll("-", "_");
        this.root = root;
        this.parent = parent;
    }

    addName(name: string) {
        this.names.push(name);
    }

    addType(type: TypeExpressionElement) {
        this.types.push(type);
    }

    clone(): Scope {
        const rc = new Scope(this.root, this.parent);
        this.names.forEach(x => rc.addName(x));
        this.types.forEach(x => rc.addType((x.clone() as TypeExpressionElement)));
        return rc;
    }
}
