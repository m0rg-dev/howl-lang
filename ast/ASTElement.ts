import { randomUUID } from "crypto";

export type SourceLocation = [number, number];

export abstract class ASTElement {
    source_location: SourceLocation;
    uuid: string;

    generator_metadata: { [key: string]: any } = {};

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

export class MarkerElement extends ASTElement {
    type: string;
    is_closer: boolean;

    constructor(loc: SourceLocation, type: string, is_closer: boolean) {
        super(loc);
        this.type = type;
        this.is_closer = is_closer;
    }

    toString() {
        if (this.is_closer) {
            return ">>" + this.type;
        } else {
            return this.type + "<<";
        }
    }
    clone(): undefined { return undefined; }
}
