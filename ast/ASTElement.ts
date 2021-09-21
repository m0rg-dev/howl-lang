
export type SourceLocation = [number, number];

export abstract class ASTElement {
    source_location: SourceLocation;

    constructor(loc: SourceLocation) {
        this.source_location = loc;
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


