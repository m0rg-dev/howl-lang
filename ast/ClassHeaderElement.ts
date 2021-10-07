import { ASTElement, SourceLocation } from "./ASTElement";

export class ClassHeaderElement extends ASTElement {
    name: string;
    generics: string[];
    parent: string;
    interfaces: string[];
    is_interface: boolean;

    constructor(loc: SourceLocation, name: string, generics: string[], parent: string, interfaces: string[], is_interface: boolean) {
        super(loc);
        this.name = name;
        this.generics = generics;
        this.parent = parent;
        this.interfaces = interfaces;
        this.is_interface = is_interface;
    }

    clone() {
        return new ClassHeaderElement(this.source_location, this.name, [...this.generics], this.parent, [...this.interfaces], this.is_interface);
    }

    toString() {
        return `${this.is_interface ? "Interface" : "Class"}Header<${this.generics.join(", ")}>(${this.name})${this.parent ? ` extends ${this.parent}` : ""}${this.interfaces.map(x => ` implements ${x}`)}`;
    }
}
