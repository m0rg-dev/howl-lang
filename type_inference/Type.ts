import { Classes } from "../registry/Registry";

export abstract class Type {
    abstract toString(): string;
    abstract equals(other: Type): boolean;
}

export abstract class ClosureType extends Type {
    abstract evaluable(): boolean
    abstract evaluator(): () => Type;
}

export class RawPointerType extends Type {
    source: Type;
    constructor(source: Type) {
        super();
        this.source = source;
    }

    toString() { return "!*" + this.source.toString(); }
    equals(other: Type) {
        if (!(other instanceof RawPointerType)) return false;
        return other.source.equals(this.source);
    }
}


export class ClassReferenceType extends ClosureType {
    name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    evaluable() { return true; }
    evaluator() {
        return () => {
            return Classes.get(this.name).type();
        }
    }
    toString() { return `class[${this.name}]` }
    equals(other: Type) {
        return false;
    }
}