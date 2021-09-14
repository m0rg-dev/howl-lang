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

var label_ctr = 0;
export class IRLabel {
    index: number;
    constructor() {
        this.index = label_ctr++;
    }
    toString = () => `L${this.index}`
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

export class IRLabelStatement extends IRStatement {
    label: IRLabel;

    constructor(label: IRLabel) {
        super();
        this.label = label;
    }

    toString = () => `br label %${this.label}\n${this.label}:`;
}

export class GEPStructStatement extends IRStatement {
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

export class GEPPointerStatement extends IRStatement {
    target: IRLocation;
    source: IRLocation;
    index: IRLocation;

    constructor(target: IRLocation, source: IRLocation, index: IRLocation) {
        super();
        this.target = target;
        this.source = source;
        this.index = index;
    }

    toString = () => `${this.target.location} = getelementptr ${(this.source.type as IRPointerType).sub}, ${this.source.type} ${this.source.location}, ${this.index.type} ${this.index.location}`;
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
        if (!(source.type instanceof IRPointerType && source.type.sub instanceof IRFunctionType)) throw new Error(`attempted to call non-function type ${source.type}`);
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

export class IRBitcast extends IRStatement {
    target: IRLocation;
    source: IRLocation;

    constructor(target: IRLocation, source: IRLocation) {
        super();
        this.target = target;
        this.source = source;
    }

    toString = () => `${this.target.location} = bitcast ${this.source.type} ${this.source.location} to ${this.target.type}`;
}

export class IRIntegerCompare extends IRStatement {
    target: IRLocation;
    lhs: IRLocation;
    rhs: IRLocation;
    mode: string;

    constructor(target: IRLocation, lhs: IRLocation, rhs: IRLocation, mode: string) {
        super();
        this.lhs = lhs;
        this.rhs = rhs;
        this.mode = mode;
        this.target = target;
    }

    toString = () => `${this.target.location} = icmp ${this.mode} ${this.lhs.type} ${this.lhs.location}, ${this.rhs.location}`;
}

export class IRConditionalBranch extends IRStatement {
    if_true: IRLabel;
    if_false: IRLabel;
    cond: IRLocation;

    constructor(if_true: IRLabel, if_false: IRLabel, cond: IRLocation) {
        super();
        this.if_true = if_true;
        this.if_false = if_false;
        this.cond = cond;
    }

    toString = () => `br ${this.cond.type} ${this.cond.location}, label %${this.if_true}, label %${this.if_false}`;
}

export class IRBranch extends IRStatement {
    target: IRLabel;
    constructor(target: IRLabel) {
        super();
        this.target = target;
    }

    toString = () => `br label %${this.target}`;
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