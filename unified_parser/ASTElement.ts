import { randomUUID } from "crypto";
import { Token } from "../lexer/Token";
import { Scope } from "./Scope";
import { Transformer } from "./Transformer";

export type TokenStream = (Token | ASTElement)[];

export abstract class ASTElement {
    guid: string;
    constructor() {
        this.guid = randomUUID().replace(/-/g, "_");
    }
    abstract toString(): string;
    isAstElement(): boolean { return true; }

    walk(t: Transformer, replace: (n: ASTElement) => void, parent?: ASTElement) {
        for (const key in this) {
            if ((typeof this[key] == "object") && isAstElement(this[key])) {
                ((this[key] as any) as ASTElement).walk(t, (n: ASTElement) => {
                    (this[key] as any) = n
                }, this);
            } else if ((typeof this[key] == "object")
                && this[key].constructor == Array
                && ((this[key] as any) as any[]).length > 0) {
                (((this[key] as any) as any[]).forEach((x, y) => {
                    if (isAstElement(x)) {
                        x.walk(t, (n: ASTElement) => ((this[key] as any) as any[])[y] = n, this)
                    }
                }));
            }
        }
        t(this, replace, parent);
    }

    scope: Scope = new Scope();
    hasOwnScope = false;
}

export function isAstElement(obj: Object): obj is ASTElement {
    return "isAstElement" in obj;
}
