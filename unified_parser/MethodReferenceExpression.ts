import { ClassType, FunctionType } from "./TypeObject";
import { ASTElement } from "./ASTElement";

export class MethodReferenceExpression extends ASTElement {
    source: ASTElement;
    method: string;

    constructor(parent: ASTElement, source: ASTElement, method: string) {
        super(undefined, parent);
        if (!(source.value_type instanceof ClassType)) throw new Error(`Can't take fields on ${source}`);
        const method_obj = source.value_type.source.methods.find(x => x.name == method);
        if (!method_obj) throw new Error(`Can't find method ${method} on ${source}`);
        this.value_type = method_obj.value_type;
        this.source = source;
        this.method = method;
    }

    toString = () => `${this.source.toString()}->${this.method}`
}

