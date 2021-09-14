export type IRBlock = {
    output_location: IRLocation;
    statements: IRStatement[];
    sub_blocks?: IRBlock[];
}

export abstract class IRType {
    abstract toString(): string;
};

export type IRLocation = {
    type: IRType,
    location: IRIdentifier;
};

export abstract class IRIdentifier {
    abstract toString(): string;
};

export class IRNamedIdentifier extends IRIdentifier {
    t: string;
    constructor(t: string) { super(); this.t = t; }
    toString = () => this.t;
}

export class IRNumericLiteral extends IRIdentifier {
    n: number;
    constructor(n: number) { super(); this.n = n; }
    toString = () => this.n.toString();
}


var tentative_ctr = 0;
export class IRTemporary extends IRIdentifier {
    tentative = true;
    index: number;
    constructor() {
        super();
        this.index = tentative_ctr++;
    }
    toString = () => `%${this.tentative ? 'temp' : ''}${this.index}`;
}

export abstract class IRStatement {
    abstract toString(): string;
};

export interface Synthesizable {
    synthesize(): IRBlock;
}

export function isSynthesizable(x: Object): x is Synthesizable {
    return "synthesize" in x;
}

export class IRClassType extends IRType {
    cl: string;
    constructor(cl: string) { super(); this.cl = cl; }
    toString = () => `%${this.cl}`;
}

export class IRBaseType extends IRType {
    t: string;
    constructor(t: string) { super(); this.t = t; }
    toString = () => this.t;
}

export class IRFunctionType extends IRType {
    rc: IRType;
    args: IRType[];
    constructor(rc: IRType, args: IRType[]) { super(); this.rc = rc; this.args = args; }
    toString = () => `${this.rc}(${this.args.join(", ")})`;
}

export class IRPointerType extends IRType {
    sub: IRType;
    constructor(sub: IRType) { super(); this.sub = sub; }
    toString = () => `${this.sub}*`;
}

export class GEPStatement extends IRStatement {
    target: IRLocation;
    source: IRLocation;
    fields: number[];

    constructor(target: IRLocation, source: IRLocation, ...fields: number[]) {
        super();
        if (!(source.type instanceof IRPointerType)) throw new Error(`attempted to GEP non-pointer type ${source.type}`);
        this.target = target;
        this.source = source;
        this.fields = fields;
    }

    toString = () => `${this.target.location} = getelementptr ${(this.source.type as IRPointerType).sub}, ${this.source.type} ${this.source.location}, i64 0, ${this.fields.map(x => `i32 ${x}`).join(", ")}`;
}

export class IRNullaryReturn extends IRStatement {
    toString = () => `ret void`;
}

export class IRUnaryReturn extends IRStatement {
    source: IRLocation;

    constructor(source: IRLocation) {
        super();
        this.source = source;
    }

    toString = () => `ret ${this.source.type} ${this.source.location}`;
}

export class IRLoad extends IRStatement {
    target: IRLocation;
    source: IRLocation;

    constructor(target: IRLocation, source: IRLocation) {
        super();
        if (!(source.type instanceof IRPointerType)) throw new Error("attempted to load non-pointer type");
        this.target = target;
        this.source = source;
    }

    toString = () => `${this.target.location} = load ${(this.source.type as IRPointerType).sub}, ${this.source.type} ${this.source.location}`;
}

export class IRStore extends IRStatement {
    source: IRLocation;
    target: IRLocation;

    constructor(source: IRLocation, target: IRLocation) {
        super();
        if (!(target.type instanceof IRPointerType)) throw new Error("attempted to store into non-pointer type");
        this.target = target;
        this.source = source;
    }

    toString = () => `store ${this.source.type} ${this.source.location}, ${this.target.type} ${this.target.location}`;
}

export class IRCall extends IRStatement {
    target: IRLocation;
    source: IRLocation;
    args: IRLocation[];

    constructor(target: IRLocation, source: IRLocation, args: IRLocation[]) {
        super();
        if (!(source.type instanceof IRPointerType && source.type.sub instanceof IRFunctionType)) throw new Error("attempted to call non-function type");
        this.target = target;
        this.source = source;
        this.args = args;
    }

    toString = () => `${this.target.location} = call ${((this.source.type as IRPointerType).sub as IRFunctionType).rc} ${this.source.location}(${this.args.map(x => `${x.type} ${x.location}`)})`;
}

export class IRVoidCall extends IRStatement {
    source: IRLocation;
    args: IRLocation[];

    constructor(source: IRLocation, args: IRLocation[]) {
        super();
        if (!(source.type instanceof IRPointerType && source.type.sub instanceof IRFunctionType)) throw new Error("attempted to call non-function type");
        this.source = source;
        this.args = args;
    }

    toString = () => `call void ${this.source.location}(${this.args.map(x => `${x.type} ${x.location}`)})`;
}

export class IRAlloca extends IRStatement {
    target: IRLocation;

    constructor(target: IRLocation) {
        super();
        this.target = target;
    }

    toString = () => `${this.target.location} = alloca ${(this.target.type as IRPointerType).sub}`;
}

export class IRSomethingElse extends IRStatement {
    what: string;
    constructor(what: string) { super(); this.what = what; }
    toString = () => this.what;
}

export function flattenBlock(block: IRBlock): IRStatement[] {
    const statements: IRStatement[] = [];
    if (block.sub_blocks) statements.push(...block.sub_blocks.map(x => flattenBlock(x)).flat());
    statements.push(...block.statements);
    return statements;
}