import { CustomTypeObject, FunctionType, TypeObject, TypeRegistry } from "../registry/TypeRegistry";
import { ASTElement } from "./ASTElement";
import { ClassConstruct } from "./Parser";


export abstract class TypedElement extends ASTElement {
    type: TypeObject;
    constructor(type: TypeObject) {
        super();
        this.type = type;
    }
    isTypedElement = () => true;
}

export function isTypedElement(x: Object): x is TypedElement {
    return "isTypedElement" in x;
}

export class VariableReferenceExpression extends TypedElement {
    name: string;

    constructor(type: TypeObject, name: string) {
        super(type);
        this.name = name;
    }

    toString = () => `local ${this.name}`;
}

export class NumericLiteralExpression extends TypedElement {
    value: number;
    constructor(value: number) {
        super(TypeRegistry.get("_numeric_constant"));
        this.value = value;
    }
    toString = () => `#${this.value}`;
}

export class TypedFieldReferenceExpression extends TypedElement {
    source: TypedElement;
    field: string;

    constructor(source: TypedElement, field: string) {
        super(undefined);
        if (!(source.type instanceof CustomTypeObject
            && source.type.source instanceof ClassConstruct)) throw new Error(`Can't take fields on ${source}`);
        this.type = source.type.source.fields.find(x => x.name == field)?.type;
        if (!this.type) throw new Error(`Can't find field ${field} on ${source}`);
        this.source = source;
        this.field = field;
    }

    toString = () => `${this.source.toString()}.${this.field}`
}

export class MethodReferenceExpression extends TypedElement {
    source: TypedElement;
    method: string;

    constructor(source: TypedElement, method: string) {
        super(undefined);
        if (!(source.type instanceof CustomTypeObject
            && source.type.source instanceof ClassConstruct)) throw new Error(`Can't take fields on ${source}`);
        const method_obj = source.type.source.methods.find(x => x.name == method);
        this.type = new FunctionType(method_obj.returnType, method_obj.args.map(x => x.type));
        if (!this.type) throw new Error(`Can't find method ${method} on ${source}`);
        this.source = source;
        this.method = method;
    }

    toString = () => `${this.source.toString()}->${this.method}`
}