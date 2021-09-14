import { TypeRegistry } from "../registry/TypeRegistry";
import { ClassType, FunctionType, TypeObject } from "./TypeObject";
import { ASTElement } from "./ASTElement";
import { ClassConstruct } from "./ClassConstruct";

export class VariableReferenceExpression extends ASTElement {
    name: string;

    constructor(type: TypeObject, name: string) {
        super(type);
        this.name = name;
    }

    toString = () => `local ${this.name}`;
}

export class NumericLiteralExpression extends ASTElement {
    value: number;
    constructor(value: number) {
        super(TypeRegistry.get("_numeric_constant"));
        this.value = value;
    }
    toString = () => `#${this.value}`;
}

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

export class FunctionCallExpression extends ASTElement {
    source: ASTElement;
    args: ASTElement[];
    self_added = false;

    constructor(source: ASTElement, args: ASTElement[]) {
        super((source.value_type as FunctionType).rc);
        this.source = source;
        this.args = args;
    }

    toString = () => `${this.source.toString()}(${this.args.map(x => x.toString()).join(", ")})`;
}