import { ASTElement, SourceLocation } from "./ASTElement";
import { FunctionElement } from "./FunctionElement";

export class ClassElement extends ASTElement {
    name: string;
    fields: string[];
    methods: FunctionElement[];
    generics: string[];

    constructor(loc: SourceLocation, name: string, fields: string[], methods: FunctionElement[], generics: string[]) {
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
            [...this.fields],
            this.methods.map(x => x.clone()),
            [...this.generics]
        );
    }
}
