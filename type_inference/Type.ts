import { Scope } from "./Scope";
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
}

export class UnitType extends Type {
    name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    toString() { return this.name; }
}

export class GenericType extends Type {
    name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    toString() { return this.name; }
}


export class UnionType extends Type {
    subtypes: Type[];

    constructor(subtypes: Type[]) {
        super();
        this.subtypes = subtypes;
    }

    toString() { return `(${this.subtypes.map(x => x.toString()).join(" | ")})` }
}
