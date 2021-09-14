import { randomUUID } from "crypto";
import { StaticFunctionRegistry, StaticVariableRegistry } from "../registry/StaticVariableRegistry";
import { ASTElement } from "./ASTElement";
import { TypeObject } from "./TypeObject";

export class Scope {
    guid: string;
    constructor() {
        this.guid = randomUUID().replace(/-/g, "_");
    }

    locals: Map<string, TypeObject> = new Map();
    return_type?: TypeObject;
}
