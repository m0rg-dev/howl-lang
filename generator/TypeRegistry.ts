import { Class } from "../ast/Class";
import { FunctionDefinition } from "../ast/FunctionDefinition";

export interface Type {
    to_ir(): string;
    to_readable(): string;
    is_concrete(): boolean;
};

export class BaseType implements Type {
    private t: string;

    constructor(t: string) { this.t = t; }
    to_ir(): string { return this.t; }
    to_readable(): string { return this.t; }
    is_concrete = () => true;
}

export class PointerType implements Type {
    private sub: Type;

    constructor(sub: Type) { this.sub = sub; }
    to_ir(): string { return this.sub.to_ir() + "*"; }
    get_sub(): Type { return this.sub; }
    to_readable(): string { return this.sub.to_readable() + "*"; }
    is_concrete = () => true;
}

export class FunctionType implements Type {
    private ret: Type;
    private args: Type[];

    constructor(ret: Type, args: Type[]) {
        this.ret = ret;
        this.args = args;
    }

    to_ir(): string {
        return this.ret.to_ir() + "(" + this.args.map(x => x.to_ir()).join(", ") + ")";
    }

    return_type(): Type {
        return this.ret;
    }

    to_readable(): string {
        return this.ret.to_readable() + "(" + this.args.map(x => x.to_readable()).join(", ") + ")";
    }
    is_concrete = () => true;
    type_of_argument = (index: number) => this.args[index];
}

export class ClassType implements Type {
    private name: string;

    constructor(name: string) {
        this.name = name;
    }

    to_ir(): string { return "%" + this.name; }

    get_name(): string {
        return this.name;
    }

    to_readable(): string {
        return this.name;
    }
    is_concrete = () => true;
}

export const TypeRegistry: Map<string, Type> = new Map();
TypeRegistry.set("_rawptr_i8", new PointerType(new BaseType("i8")));
TypeRegistry.set("i8", new BaseType("i8"));
TypeRegistry.set("i32", new BaseType("i32"));
TypeRegistry.set("i64", new BaseType("i64"));
TypeRegistry.set("void", new BaseType("void"));

export const ClassRegistry: Map<string, Class> = new Map();
export const StaticFunctionRegistry: Map<string, FunctionDefinition> = new Map();