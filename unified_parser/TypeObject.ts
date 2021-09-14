import { IRBaseType, IRClassType, IRFunctionType, IRPointerType, IRType } from "../generator/IR";
import { ClassConstruct } from "./ClassConstruct";

export abstract class TypeObject {
    abstract toString(): string;
    abstract toIR(): IRType;
};

export class ClassType extends TypeObject {
    source: ClassConstruct;
    constructor(source: ClassConstruct) {
        super();
        this.source = source;
    }
    toString = () => `${this.source}`;
    walk() { }
    toIR = () => new IRPointerType(new IRClassType(this.source.name));
}

export class BaseType extends TypeObject {
    name: string;
    constructor(name: string) {
        super();
        this.name = name;
    }

    toString = () => `${this.name}`;
    toIR = () => new IRBaseType(this.name);
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
    toIR = () => new IRPointerType(new IRFunctionType(this.rc.toIR(), this.args.map(x => x.toIR())));
}

export class UnionType extends TypeObject {
    subtypes: TypeObject[];
    constructor(...subtypes: TypeObject[]) {
        super();
        this.subtypes = subtypes;
    }
    walk() { }
    toString = () => `${this.subtypes.join(" | ")}`;
    toIR = () => { throw new Error("can't IR-ify a union type") };
}

export class PassthroughType extends TypeObject {
    name: string;
    constructor(name: string) {
        super();
        this.name = name;
    }
    toString = () => `!${this.name}`;
    toIR = () => new IRBaseType(this.name);
}

export class RawPointerType extends TypeObject {
    subtype: TypeObject;
    constructor(subtype: TypeObject) {
        super();
        this.subtype = subtype;
    }
    toString = () => `*${this.subtype}`;
    toIR = () => new IRPointerType(this.subtype.toIR());
}