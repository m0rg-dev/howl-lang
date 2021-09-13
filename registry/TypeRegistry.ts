import { ASTElement } from "../unified_parser/ASTElement";

export abstract class TypeObject extends ASTElement { };

export class CustomTypeObject extends TypeObject {
    source: ASTElement;
    constructor(source: ASTElement) {
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

export const TypeRegistry = new Map<string, TypeObject>();

TypeRegistry.set("i8", new BaseType("i8"));
TypeRegistry.set("i32", new BaseType("i32"));
TypeRegistry.set("void", new BaseType("void"));
TypeRegistry.set("_numeric_constant", new UnionType(
    TypeRegistry.get("i32"),
    TypeRegistry.get("i8")
));
