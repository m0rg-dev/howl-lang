import { count } from "../generator/Synthesizable";
import { ClassRegistry, ClassType, Type } from "../generator/TypeRegistry";
import { Expression } from "./Expression";


export class LocalDefinitionExpression extends Expression {
    name: string;
    type: Type;

    constructor(name: string, type: Type) {
        super();
        this.name = name;
        this.type = type;
    }

    valueType = () => this.type;
    toString = () => `LocalDefinition<${this.type.to_readable()}>(${this.name})`;
    inferTypes = () => { };
    synthesize = () => {
        let s = super.synthesize().code + "\n";
        if (this.type instanceof ClassType) {
            const class_obj = ClassRegistry.get(this.type.get_name());
            s += `    ;; class zero initialization: ${this.type.to_readable()}\n`;
            s += `    %${this.name} = alloca ${this.type.to_ir()}\n`;
            const stable_ptr = count();
            s += `    %${stable_ptr} = getelementptr ${this.type.to_ir()}, ${this.type.to_ir()}* %${this.name}, i64 0, i32 0\n`;
            s += `    store %${class_obj.stable.name}* @__${class_obj.name}_stable, %${class_obj.stable.name}** %${stable_ptr}`;
        }
        return { code: s, location: `%${this.name}` };
    };
}
