import { randomUUID } from "crypto";
import { Type } from "../generator/TypeRegistry";

export abstract class Expression {
    guid: string;
    constructor() {
        this.guid = randomUUID().replace(/-/g, "_");
    }

    abstract toString(): string;
    abstract valueType(): Type;
    isExpression(): boolean { return true; }
    abstract inferTypes(): void;

    // location should contain a pointer to this.valueType().
    synthesize(): { code: string; location: string; } {
        return { code: `;; ${this.toString()}`, location: "%INVALID" };
    }
}

export function isExpression(obj: Object): obj is Expression {
    return "isExpression" in obj;
}