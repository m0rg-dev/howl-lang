import { randomUUID } from "crypto";
import { TypeConstraint } from "../typemath/Signature";

export class Scope {
    guid: string;
    constructor() {
        this.guid = randomUUID().replace(/-/g, "_");
    }

    locals: Map<string, TypeConstraint> = new Map();
    return_type?: TypeConstraint;
}
