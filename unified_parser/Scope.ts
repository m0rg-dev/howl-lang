import { randomUUID } from "crypto";
import { ASTElement } from "./ASTElement";
import { TypeObject } from "./TypeObject";

export class Scope {
    guid: string;
    constructor() {
        this.guid = randomUUID().replace(/-/g, "_");
    }
    
    locals: Map<string, TypeObject> = new Map();
    parent?: ASTElement;
    return_type?: TypeObject;

    find(name: string): TypeObject | undefined {
        if(this.locals.has(name)) return this.locals.get(name);
        if(this.parent?.scope) return this.parent.scope.find(name);
        return undefined;
    }

    get_return(): TypeObject | undefined {
        if(this.return_type) return this.return_type;
        if(this.parent?.scope) return this.parent.scope.get_return();
        return undefined;
    }
}
