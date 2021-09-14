import { randomUUID } from "crypto";
import { Token } from "../lexer/Token";
import { TypeRegistry } from "../registry/TypeRegistry";
import { Scope } from "./Scope";
import { Transformer } from "../transformers/Transformer";
import { FunctionType, TypeObject } from "./TypeObject";
import { StaticVariableRegistry, StaticFunctionRegistry } from "../registry/StaticVariableRegistry";
import { Signature } from "../typemath/Signature";

export type TokenStream = (Token | ASTElement)[];

export abstract class ASTElement {
    guid: string;
    parent: ASTElement;

    scope: Scope = new Scope();
    hasOwnScope = false;
    value_type: TypeObject;

    signature: Signature = new Signature();

    constructor(type: TypeObject, parent: ASTElement) {
        this.guid = randomUUID().replace(/-/g, "_");
        this.value_type = type;
        this.parent = parent;
    }
    abstract toString(): string;
    isAstElement(): boolean { return true; }

    walk(t: Transformer, replace: (n: ASTElement) => void, parent?: ASTElement) {
        for (const key in this) {
            if(key == "parent") continue;
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

    mostLocalScope(): Scope {
        if(this.hasOwnScope) return this.scope;
        return this.parent?.mostLocalScope();
    }

    findName(name: string): TypeObject | undefined {
        if(this.scope.locals.has(name)) return this.scope.locals.get(name);
        if(this.parent) return this.parent.findName(name);
        if (StaticVariableRegistry.has(name)) return StaticVariableRegistry.get(name).type;
        if (StaticFunctionRegistry.has(name)) {
            const fn = StaticFunctionRegistry.get(name);
            return fn.value_type;
        }
        return undefined;
    }

    isStatic(name: string): boolean {
        if(this.scope.locals.has(name)) return false;
        if(this.parent) return this.parent.isStatic(name);
        if (StaticVariableRegistry.has(name)) return true;
        if (StaticFunctionRegistry.has(name)) return true;
        return false;
    }

    getReturnType(): TypeObject | undefined {
        if(this.value_type instanceof FunctionType) return this.value_type.rc;
        if(this.parent) return this.parent.getReturnType();
        return undefined;
    }
}

export function isAstElement(obj: Object): obj is ASTElement {
    return "isAstElement" in obj;
}

export abstract class VoidElement extends ASTElement {
    constructor(parent: ASTElement) {
        super(TypeRegistry.get("void"), parent);
    }
}