import { randomUUID } from "crypto";
import { Token } from "../lexer/Token";
import { TypeRegistry } from "../registry/TypeRegistry";
import { Scope } from "./Scope";
import { Transformer } from "../transformers/Transformer";
import { TypeObject } from "./TypeObject";

export type TokenStream = (Token | ASTElement)[];

export abstract class ASTElement {
    guid: string;
    constructor(type?: TypeObject) {
        this.guid = randomUUID().replace(/-/g, "_");
        if (type) this.value_type = type;
        else this.value_type = TypeRegistry.get("_unknown");
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
    value_type: TypeObject;
}

export function isAstElement(obj: Object): obj is ASTElement {
    return "isAstElement" in obj;
}

export abstract class VoidElement extends ASTElement {
    constructor() {
        super(TypeRegistry.get("void"));
    }
}