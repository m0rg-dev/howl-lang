import { Classes } from "../registry/Registry";
import { Type } from "../type_inference/Type";
import { ConcreteType } from "../type_inference/ConcreteType";
import { ASTElement, SourceLocation } from "./ASTElement";

export class TypeElement extends ASTElement {
    name: string;

    constructor(loc: SourceLocation, name: string) {
        super(loc);
        this.name = name;
    }

    toString() {
        return `TE(${this.name})`;
    }

    clone() {
        return new TypeElement(this.source_location, this.name);
    }

    asTypeObject(): Type {
        if (Classes.has("module." + this.name)) {
            return Classes.get("module." + this.name).type();
        }
        return new ConcreteType(this.name);
    }
}
