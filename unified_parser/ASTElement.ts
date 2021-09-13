import { randomUUID } from "crypto";
import { Token } from "../lexer/Token";

export type TokenStream = (Token | ASTElement)[];

export abstract class ASTElement {
    guid: string;
    constructor() {
        this.guid = randomUUID().replace(/-/g, "_");
    }
    abstract toString(): string;
    isAstElement(): boolean { return true; }
}

export function isAstElement(obj: Object): obj is ASTElement {
    return "isAstElement" in obj;
}
