import { FunctionType, GenericType, SigmaType } from "../type_inference/Type";
import { ASTElement, SourceLocation } from "./ASTElement";
import { FunctionElement } from "./FunctionElement";
import { TypedItemElement } from "./TypedItemElement";

export class ClassElement extends ASTElement {
    name: string;
    fields: TypedItemElement[];
    methods: FunctionElement[];
    generics: string[];

    constructor(loc: SourceLocation, name: string, fields: TypedItemElement[], methods: FunctionElement[], generics: string[]) {
        super(loc);
        this.name = name;
        this.fields = fields;
        this.methods = methods;
        this.generics = generics;
    }

    toString() {
        return `Class<${this.generics.join(", ")}>(${this.name})`;
    }

    clone() {
        return new ClassElement(
            this.source_location,
            this.name,
            this.fields.map(x => x.clone()),
            this.methods.map(x => x.clone()),
            [...this.generics]
        );
    }

    type(): SigmaType {
        const t = new SigmaType(this.name);
        this.fields.forEach((x) => t.fields.set(x.name, x.type));
        this.methods.forEach((x) => t.fields.set(x.name, new FunctionType(x)));
        return t;
    }
}
