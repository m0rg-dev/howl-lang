import { randomUUID } from "crypto";
import { Token } from "../lexer/Token";
import { StaticFunctionRegistry, StaticVariableRegistry } from "../registry/StaticVariableRegistry";
import { Transformer } from "../transformers/Transformer";
import { ExactConstraint, Signature } from "../typemath/Signature";
import { isSpecifiable, Specifiable } from "../typemath/Specifiable";
import { Scope } from "./Scope";
import { FunctionType, TypeObject } from "./TypeObject";

export type TokenStream = (Token | ASTElement)[];

export abstract class ASTElement {
    guid: string;
    parent: ASTElement;

    scope: Scope = new Scope();
    hasOwnScope = false;
    computed_type: TypeObject;

    signature: Signature = new Signature();

    constructor(parent: ASTElement) {
        this.guid = randomUUID().replace(/-/g, "_");
        this.parent = parent;
    }
    abstract toString(): string;
    isAstElement(): boolean { return true; }

    walk(t: Transformer, replace: (n: ASTElement) => void, parent?: ASTElement) {
        for (const key in this) {
            if (key == "parent") continue;
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
        if (this.hasOwnScope) return this.scope;
        return this.parent?.mostLocalScope();
    }

    mostLocalTemplate(): Specifiable {
        if(isSpecifiable(this)) return this;
        return this.parent?.mostLocalTemplate();
    }

    findPortOwner(name: string): Specifiable {
        if(isSpecifiable(this) && this.getConstraint(name)) return this;
        return this.parent?.findPortOwner(name);
    }

    findName(name: string): TypeObject | undefined {
        if (this.scope.locals.has(name)) return this.scope.locals.get(name);
        if (this.parent) return this.parent.findName(name);
        if (StaticVariableRegistry.has(name)) return StaticVariableRegistry.get(name).type;
        if (StaticFunctionRegistry.has(name)) {
            const fn = StaticFunctionRegistry.get(name);
            return fn.as_type();
        }
        return undefined;
    }

    isStatic(name: string): boolean {
        if (this.scope.locals.has(name)) return false;
        if (this.parent) return this.parent.isStatic(name);
        if (StaticVariableRegistry.has(name)) return true;
        if (StaticFunctionRegistry.has(name)) return true;
        return false;
    }

    getReturnType(): TypeObject | undefined {
        if (this.singleValueType() instanceof FunctionType) return (this.singleValueType() as FunctionType).rc;
        if (this.parent) return this.parent.getReturnType();
        return undefined;
    }

    singleValueType(): TypeObject | undefined {
        if (this.computed_type) return this.computed_type;
        if (this.signature.type_constraints.has("value")
            && this.signature.type_constraints.get("value") instanceof ExactConstraint) {
            return (this.signature.type_constraints.get("value") as ExactConstraint).t;
        }
    }
}

export function isAstElement(obj: Object): obj is ASTElement {
    return (typeof obj == "object") && "isAstElement" in obj;
}
