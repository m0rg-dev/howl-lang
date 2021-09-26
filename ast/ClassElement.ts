import { FunctionType, GenericType, StructureType } from "../type_inference/Type";
import { ASTElement, SourceLocation } from "./ASTElement";
import { FunctionElement } from "./FunctionElement";
import { TypedItemElement } from "./TypedItemElement";

export class ClassElement extends ASTElement {
    fqn: string[];
    fields: TypedItemElement[];
    methods: FunctionElement[];
    generics: string[];

    constructor(loc: SourceLocation, fqn: string[], fields: TypedItemElement[], methods: FunctionElement[], generics: string[]) {
        super(loc);
        this.fqn = fqn;
        this.fields = fields;
        this.methods = methods;
        this.generics = generics;
    }

    toString() {
        return `Class<${this.generics.join(", ")}>(${this.fqn.join(".")})`;
    }

    clone() {
        return new ClassElement(
            this.source_location,
            [...this.fqn],
            this.fields.map(x => x.clone()),
            this.methods.map(x => x.clone()),
            [...this.generics]
        );
    }

    type(): StructureType {
        const t = new StructureType(this.fqn[this.fqn.length - 1]);
        this.fields.forEach((x) => t.fields.set(x.name, x.type));
        this.methods.forEach((x) => t.fields.set(x.fqn[x.fqn.length - 1], new FunctionType(x)));
        return t;
    }
}
