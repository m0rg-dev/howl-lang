import { ASTElement } from "./ASTElement";
import { ClassConstruct } from "./ClassConstruct";

export abstract class TypeObject {
    abstract toString(): string;
 };

export class ClassType extends TypeObject {
    source: ClassConstruct;
    constructor(source: ClassConstruct) {
        super();
        this.source = source;
    }
    toString = () => `${this.source}`;
    walk() { }
}

export class BaseType extends TypeObject {
    name: string;
    constructor(name: string) {
        super();
        this.name = name;
    }

    toString = () => `${this.name}`;
}

export class FunctionType extends TypeObject {
    rc: TypeObject;
    args: TypeObject[];
    constructor(rc: TypeObject, args: TypeObject[]) {
        super();
        this.rc = rc;
        this.args = args;
    }
    walk() { }
    toString = () => `${this.rc}(${this.args.join(",")})`;
}

export class UnionType extends TypeObject {
    subtypes: TypeObject[];
    constructor(...subtypes: TypeObject[]) {
        super();
        this.subtypes = subtypes;
    }
    walk() { }
    toString = () => `${this.subtypes.join(" | ")}`;
}
