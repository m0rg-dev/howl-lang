import { count } from "../generator/Synthesizable";
import { ClassRegistry, ClassType, PointerType, Type } from "../generator/TypeRegistry";
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
        if (this.type instanceof PointerType && this.type.get_sub() instanceof ClassType) {
            const class_type = this.type.get_sub() as ClassType;
            const class_obj = ClassRegistry.get(class_type.get_name());
            s += `    ;; class zero initialization: ${class_type.to_readable()}\n`;
            const obj_ptr = `%${count()}`;
            const stable_ptr = count();
            s += `    ${obj_ptr} = alloca ${class_type.to_ir()}\n`;
            s += `    %${stable_ptr} = getelementptr ${class_type.to_ir()}, ${class_type.to_ir()}* ${obj_ptr}, i64 0, i32 0\n`;
            s += `    store %${class_obj.stable.name}* @__${class_obj.name}_stable, %${class_obj.stable.name}** %${stable_ptr}\n`;
            s += `    %${this.name} = alloca ${class_type.to_ir()}*\n`;
            s += `    store ${class_type.to_ir()}* ${obj_ptr}, ${class_type.to_ir()}** %${this.name}`;
        }
        return { code: s, location: `%${this.name}` };
    };
}
