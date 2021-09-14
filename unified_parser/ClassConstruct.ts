import { TypeRegistry } from "../registry/TypeRegistry";
import { VoidElement } from "./ASTElement";
import { ClassField } from "./Parser";
import { FunctionConstruct } from "./FunctionConstruct";
import { ClassType } from "./TypeObject";
import { IRBlock, IRSomethingElse, Synthesizable } from "../generator/IR";


export class ClassConstruct extends VoidElement implements Synthesizable {
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

    synthesize(): IRBlock {
        return {
            output_location: undefined,
            statements: [
                new IRSomethingElse(`%${this.name} = type {`),
                new IRSomethingElse(this.fields.map(x => x.type_literal.value_type.toIR().toString()).join(", ")),
                new IRSomethingElse(`}`)
            ]
        };
    }
}
