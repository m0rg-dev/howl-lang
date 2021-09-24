import { Scope } from "../ast/Scope";
import { TypeExpressionElement, TypeIndexElement, TypeLiteralElement } from "../ast/TypeExpressionElement";

export class TypeLocation {
    location: Scope;
    index: number;

    constructor(location: Scope, index: number) {
        this.location = location;
        this.index = index;
    }

    toString() {
        return `${this.index}@${this.location.n}`;
    }
};

export abstract class Type {
    abstract toString(): string;
    abstract evaluate(): Type;
}

export class BaseType extends Type {
    name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    toString() { return this.name; }
    evaluate() { return this; }
}

export class ReferencedIndexedType extends Type {
    source: number;
    index: number;

    constructor(source: number, index: number) {
        super();
        this.source = source;
        this.index = index;
    }

    toString() { return `${this.source}[${this.index}]` }

    evaluate() {
        return this; // new IndexedType(scope.types[this.source], this.index);
    }
}

export class IndexedType extends Type {
    source: Type;
    index: number;

    constructor(source: Type, index: number) {
        super();
        this.source = source;
        this.index = index;
    }

    toString() { return `${this.source}[${this.index}]` }
    evaluate() { return this; }
}

export class UnionType extends Type {
    subtypes: Type[];

    constructor(subtypes: Type[]) {
        super();
        this.subtypes = subtypes;
    }

    toString() { return `(${this.subtypes.map(x => x.toString()).join(" | ")})` }
    evaluate() { return this; }
}

export class AnyType extends Type {
    toString() { return "*"; }
    evaluate() { return this; }
}

export function FromExpression(e: TypeExpressionElement): Type {
    if (e instanceof TypeLiteralElement) {
        if (e.name == "any") return new AnyType();
        return new BaseType(e.name);
    } else if (e instanceof TypeIndexElement) {
        return new ReferencedIndexedType(e.source, e.index);
    } else {
        throw new Error(e.constructor.name);
    }
}
