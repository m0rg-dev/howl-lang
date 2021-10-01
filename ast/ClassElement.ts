import { FunctionType } from "../type_inference/FunctionType";
import { StructureType } from "../type_inference/StructureType";
import { ASTElement, SourceLocation } from "./ASTElement";
import { FunctionElement } from "./FunctionElement";
import { TypedItemElement } from "./TypedItemElement";

export class ClassElement extends ASTElement {
    name: string;

    fields: TypedItemElement[];
    methods: FunctionElement[];
    generics: string[];
    is_monomorphization = false;

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

    type(): StructureType {
        const t = new StructureType(this.name, new Set(this.generics));
        this.fields.forEach((x) => t.addField(x.name, x.type));
        this.methods.forEach((x) => t.addField(x.getFQN().last().split(".").pop(), new FunctionType(x)));
        return t;
    }

    setName(n: string) {
        this.name = n;
    }
}
