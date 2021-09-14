import { TypeRegistry } from "../registry/TypeRegistry";
import { VoidElement } from "./ASTElement";
import { ClassField, FunctionConstruct } from "./Parser";
import { ClassType } from "./TypeObject";


export class ClassConstruct extends VoidElement {
    name: string;
    fields: ClassField[] = [];
    methods: FunctionConstruct[] = [];
    is_stable = false;
    has_stable = false;
    constructor(name: string) {
        super();
        this.name = name;
        TypeRegistry.set(this.name, new ClassType(this));
    }
    toString = () => `Class(${this.name})`;
    stableType = () => TypeRegistry.get(`__${this.name}_stable_t`) as ClassType;
}
