import { IRBaseType, IRClassType, IRFunctionType, IRPointerType, IRType } from "../generator/IR";
import { TypeConstraint } from "../typemath/Signature";
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

export var template_name_registry = new Map<string, string>();
var template_resolution_registry = new Map<string, TypeObject>();
export class TemplateType extends TypeObject {
    private name: string;
    private resolution: TypeObject;
    constructor(name: string) {
        super();
        this.name = name;
        template_name_registry.set(name, name);
    }
    toString = () => template_resolution_registry.has(this.getName()) ? template_resolution_registry.get(this.getName()).toString() : `:${this.getName()}`;
    toIR = () => template_resolution_registry.has(this.getName()) ? template_resolution_registry.get(this.getName()).toIR() : `%TEMPLATE:${this.getName()}`;

    getName = () => {
        let n = this.name;
        while(n != template_name_registry.get(n)) {
            n = template_name_registry.get(n);
        }
        return n;
    }
    getResolution = () => template_resolution_registry.get(this.getName());
    rename = (n: string) => template_name_registry.set(this.name, n);
    resolve = (n: TypeObject) => template_resolution_registry.set(this.name, n);
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
    toIR = () => `%UNION`;
}

export class TupleType extends TypeObject {
    subtypes: TypeObject[];
    constructor(subtypes: TypeObject[]) {
        super();
        this.subtypes = subtypes;
    }
    walk() { }
    toString = () => `(${this.subtypes.join(", ")})`;
    toIR = () => `%TUPLE(${this.subtypes.join(",")})`;
}

export class AnyType extends TypeObject {
    toString = () => `*`;
    toIR = () => { throw new Error("can't IR an AnyType, check your type propagation") }
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
