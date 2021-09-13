import { ASTElement } from "../unified_parser/ASTElement";

export abstract class TypeObject extends ASTElement {};

export class CustomTypeObject extends TypeObject {
    source: ASTElement;
    constructor(source: ASTElement) {
        super();
        this.source = source;
    }
    toString = () => `%(${this.source})`;
}

export class BaseType extends TypeObject {
    name: string;
    constructor(name: string) {
        super();
        this.name = name;
    }

    toString = () => `%[${this.name}]`;
}

export const TypeRegistry = new Map<string, TypeObject>();

TypeRegistry.set("i32", new BaseType("i32"));

