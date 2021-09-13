import { randomUUID } from "crypto";
import { TypeObject } from "../registry/TypeRegistry";
import { ASTElement } from "./ASTElement";

export class Scope {
    guid: string;
    constructor() {
        this.guid = randomUUID().replace(/-/g, "_");
    }
    
    locals: Map<string, TypeObject> = new Map();
    parent?: ASTElement;
    return_type?: TypeObject;
}
