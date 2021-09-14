import { ClassType, FunctionType } from "./TypeObject";
import { ASTElement } from "./ASTElement";

export class MethodReferenceExpression extends ASTElement {
    source: ASTElement;
    method: string;

    constructor(source: ASTElement, method: string) {
        super(undefined);
        if (!(source.value_type instanceof ClassType)) throw new Error(`Can't take fields on ${source}`);
        const method_obj = source.value_type.source.methods.find(x => x.name == method);
        this.value_type = new FunctionType(method_obj.return_type_literal.value_type, method_obj.args.map(x => x.type_literal.value_type));
        if (!this.value_type) throw new Error(`Can't find method ${method} on ${source}`);
        this.source = source;
        this.method = method;
    }

    toString = () => `${this.source.toString()}->${this.method}`
}

