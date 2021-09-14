import { randomUUID } from "crypto";
import { StaticFunctionRegistry, StaticVariableRegistry } from "../registry/StaticVariableRegistry";
import { ASTElement } from "./ASTElement";
import { FunctionType, TypeObject } from "./TypeObject";

export class Scope {
    guid: string;
    constructor() {
        this.guid = randomUUID().replace(/-/g, "_");
    }

    locals: Map<string, TypeObject> = new Map();
    parent?: ASTElement;
    return_type?: TypeObject;

    find(name: string): TypeObject | undefined {
        if (this.locals.has(name)) return this.locals.get(name);
        if (this.parent?.scope) return this.parent.scope.find(name);
        if (StaticVariableRegistry.has(name)) return StaticVariableRegistry.get(name).type;
        if (StaticFunctionRegistry.has(name)) {
            const fn = StaticFunctionRegistry.get(name);
            return new FunctionType(fn.return_type_literal.value_type,
                fn.args.map(x => x.type_literal.value_type));
        }
        return undefined;
    }

    is_static(name: string): boolean {
        if (this.locals.has(name)) return false;
        if (this.parent?.scope) return this.parent.scope.is_static(name);
        if (StaticVariableRegistry.has(name)) return true;
        if (StaticFunctionRegistry.has(name)) return true;
    }

    get_return(): TypeObject | undefined {
        if (this.return_type) return this.return_type;
        if (this.parent?.scope) return this.parent.scope.get_return();
        return undefined;
    }
}
