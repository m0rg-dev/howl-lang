import { count } from "../generator/Synthesizable";
import { ClassRegistry, ClassType, Type } from "../generator/TypeRegistry";
import { Expression } from "./Expression";
import { InferSubField } from "./ExpressionParser";


export class FieldReferenceExpression extends Expression {
    sub: Expression;
    field: string;
    type: Type;

    constructor(sub: Expression, field: string, type: Type) {
        super();
        this.sub = sub;
        this.field = field;
        this.type = type;
    }

    valueType = () => this.type;
    toString(): string {
        return `FieldReference<${this.type.to_readable()}>(${this.sub.toString()}, ${this.field})`;
    }
    inferTypes = () => {
        InferSubField(this.sub, (n) => this.sub = n);
    };

    synthesize(): { code: string; location: string; } {
        const index = ClassRegistry.get((this.sub.valueType() as ClassType).get_name()).field_index(this.field);
        if(index < 0) {
            throw new Error(`couldn't find ${this.field} in ${this.sub.valueType().to_readable()}`);
        }
        let s = `${super.synthesize().code}\n`;
        const sub = this.sub.synthesize();

        s += `    ${sub.code}\n`;
        const ptr = `%${count()}`;
        s += `    ${ptr} = getelementptr ${this.sub.valueType().to_ir()}, ${this.sub.valueType().to_ir()}* ${sub.location}, i64 0, i32 ${index}`;

        return { code: s, location: ptr };
    }
}

export class MethodReferenceExpression extends FieldReferenceExpression {
    self: Expression;

    constructor(sub: Expression, field: string, type: Type, self: Expression) {
        super(sub, field, type);
        this.self = self;
    }

    toString(): string {
        return `MethodReference<${this.type.to_readable()}>(${this.sub.toString()}, ${this.field})`;
    }
}
