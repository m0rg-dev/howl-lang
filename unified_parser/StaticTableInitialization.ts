import { IRBlock, IRSomethingElse, Synthesizable } from "../generator/IR";
import { StaticInitializer } from "../registry/StaticVariableRegistry";
import { ClassConstruct } from "./ClassConstruct";
import { StaticFunctionReference } from "./StaticFunctionReference";

export class StaticTableInitialization extends StaticInitializer implements Synthesizable {
    for_class: ClassConstruct;
    fields: StaticFunctionReference[] = [];

    constructor(for_class: ClassConstruct) {
        super();
        this.for_class = for_class;
    }

    toString = () => `stable for ${this.for_class.name}`;
    synthesize(): IRBlock {
        return {
            output_location: undefined,
            statements: [
                new IRSomethingElse(`@__${this.for_class.name}_stable = constant %__${this.for_class.name}_stable_t {${this.fields.map(x => `${x.field_type.toIR()} @${x.name}`).join(", ")}}`)
            ]
        };
    }
}
