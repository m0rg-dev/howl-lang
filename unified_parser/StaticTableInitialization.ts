import { StaticInitializer } from "../registry/StaticVariableRegistry";
import { ClassConstruct } from "./ClassConstruct";
import { StaticFunctionReference } from "./StaticFunctionReference";

export class StaticTableInitialization extends StaticInitializer {
    for_class: ClassConstruct;
    fields: StaticFunctionReference[] = [];

    constructor(for_class: ClassConstruct) {
        super();
        this.for_class = for_class;
    }

    toString = () => `stable for ${this.for_class.name}`;
}
