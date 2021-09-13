import { randomUUID } from "crypto";
import { Type } from "../generator/TypeRegistry";
import { Expression } from "../expression/Expression";

export abstract class ASTElement {
    guid: string;
    constructor() {
        this.guid = randomUUID().replace(/-/g, "_");
    }
    abstract toString(): string;
    abstract valueType(): Type;
    isAstElement(): boolean { return true; }
}

export function isAstElement(obj: Object): obj is ASTElement {
    return "isAstElement" in obj;
}
