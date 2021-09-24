import { randomUUID } from "crypto";
import { Type } from "../type_inference/Type";
import { Scope } from "./Scope";

export type SourceLocation = [number, number];

export abstract class ASTElement {
    source_location: SourceLocation;
    uuid: string;

    constructor(loc: SourceLocation) {
        this.source_location = loc;
        this.uuid = randomUUID().replaceAll("-", "_");
    }

    abstract clone<T>(): ThisType<T>;
    abstract toString(): string;
}

export abstract class PartialElement extends ASTElement {
    body: ASTElement[];

    constructor(loc: SourceLocation, body: ASTElement[]) {
        super(loc);
        this.body = [...body];
    }

    clone(): undefined { return undefined; }
}


