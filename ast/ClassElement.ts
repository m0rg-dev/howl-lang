import { ASTElement, SourceLocation } from "./ASTElement";
import { SignatureElement } from "./SignatureElement";

export class ClassElement extends ASTElement {
    name: string;
    type: SignatureElement;
    fields: string[];
    methods: string[];

    constructor(loc: SourceLocation, name: string, type: SignatureElement, fields: string[], methods: string[]) {
        super(loc);
        this.name = name;
        this.type = type;
        this.fields = fields;
        this.methods = methods;
    }

    toString() {
        return `Class(${this.name})`;
    }

    clone() {
        return new ClassElement(
            this.source_location,
            this.name,
            this.type.clone(),
            [...this.fields],
            [...this.methods]
        );
    }
}
