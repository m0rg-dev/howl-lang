import { ASTElement } from "./ASTElement";
import { ClassConstruct } from "./ClassConstruct";
import { ClassType } from "./TypeObject";


export class FieldReferenceExpression extends ASTElement {
    source: ASTElement;
    field: string;

    constructor(source: ASTElement, field: string) {
        super(undefined);
        this.source = source;
        this.field = field;
    }

    toString = () => `${this.source.toString()}.${this.field}`;
    index(): number {
        if (this.source.value_type instanceof ClassType) {
            return this.source.value_type.source.fields.findIndex(x => x.name == this.field);
        }
        return -1;
    }
}
