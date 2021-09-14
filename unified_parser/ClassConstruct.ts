import { TypeRegistry } from "../registry/TypeRegistry";
import { VoidElement } from "./ASTElement";
import { ClassField, FunctionConstruct } from "./Parser";
import { CustomTypeObject } from "./TypeObject";


export class ClassConstruct extends VoidElement {
    name: string;
    fields: ClassField[] = [];
    methods: FunctionConstruct[] = [];
    is_stable = false;
    has_stable = false;
    constructor(name: string) {
        super();
        this.name = name;
    }
    toString = () => `Class(${this.name})`;
    stableType = () => TypeRegistry.get(`__${this.name}_stable_t`) as CustomTypeObject;
}
