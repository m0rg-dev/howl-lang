import { VoidElement } from "./ASTElement";
import { ClassConstruct } from "./ClassConstruct";
import { StaticFunctionReference } from "./StaticFunctionReference";

export class StaticTableInitialization extends VoidElement {
    for_class: ClassConstruct;
    fields: StaticFunctionReference[] = [];

    constructor(for_class: ClassConstruct) {
        super();
        this.for_class = for_class;
    }

    toString = () => `stable for ${this.for_class.name}`;
}
