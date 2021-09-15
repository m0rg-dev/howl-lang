import { TypeRegistry } from "../registry/TypeRegistry";
import { ASTElement } from "./ASTElement";
import { ClassField } from "./Parser";
import { FunctionConstruct } from "./FunctionConstruct";
import { ClassType } from "./TypeObject";
import { IRBlock, IRSomethingElse, Synthesizable } from "../generator/IR";


export class ClassConstruct extends ASTElement implements Synthesizable {
    name: string;
    fields: ClassField[] = [];
    methods: FunctionConstruct[] = [];
    is_stable = false;
    has_stable = false;
    constructor(parent: ASTElement, name: string) {
        super(parent);
        this.name = name;

        // not cursed at all >_>
        if (TypeRegistry.has(this.name)) {
            (TypeRegistry.get(this.name) as ClassType).source = this;
        } else {
            TypeRegistry.set(this.name, new ClassType(this));
        }
    }
    toString = () => `Class(${this.name})`;
    stableType = () => TypeRegistry.get(`__${this.name}_stable_t`) as ClassType;

    synthesize(): IRBlock {
        return {
            output_location: undefined,
            statements: [
                new IRSomethingElse(`%${this.name} = type {`),
                new IRSomethingElse(this.fields.map(x => x.field_type.toIR().toString()).join(", ")),
                new IRSomethingElse(`}`)
            ]
        };
    }
}
