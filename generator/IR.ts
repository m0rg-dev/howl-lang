import { Synthesizable } from "./Synthesizable";
import { PointerType, Type } from "./TypeRegistry";

export abstract class IRStatement implements Synthesizable {
    abstract synthesize(): string;
}

export class LoadStatement extends IRStatement {
    type: Type;
    source: string;
    dest: string;

    constructor(type: Type, source: string, dest: string) {
        super();
        this.type = type;
        this.source = source;
        this.dest = dest;
    }

    synthesize(): string {
        return `    ${this.dest} = load ${this.type.to_ir()}, ${new PointerType(this.type).to_ir()} ${this.source}\n`;
    }
}

export class StoreStatement extends IRStatement {
    type: PointerType;
    source: string;
    dest: string;

    constructor(type: PointerType, source: string, dest: string) {
        super();
        this.type = type;
        this.source = source;
        this.dest = dest;
    }

    synthesize(): string {
        return `    store ${this.type.get_sub().to_ir()} ${this.source}, ${this.type.to_ir()} ${this.dest}\n`;
    }
}

export class AllocaStatement extends IRStatement {
    type: Type;
    dest: string;

    constructor(type: Type, dest: string) {
        super();
        this.type = type;
        this.dest = dest;
    }

    synthesize(): string {
        return `    ${this.dest} = alloca ${this.type.to_ir()}\n`;
    }
}

export class GetElementPtrStatement extends IRStatement {
    steps: { type: Type, index: number }[] = [];
    type: Type;
    source: string;
    dest: string;

    constructor(type: Type, source: string, dest: string) {
        super();
        this.type = type;
        this.source = source;
        this.dest = dest;
    }

    add_step(type: Type, index: number) {
        this.steps.push({ type, index });
    }

    synthesize(): string {
        return `    ${this.dest} = getelementptr ${this.type.to_ir()}, ${new PointerType(this.type).to_ir()} ${this.source}, `
            + this.steps.map(x => `${x.type.to_ir()} ${x.index}`).join(", ") + "\n";
    }
}