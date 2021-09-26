import { Classes } from "../registry/Registry";
import { Type } from "../type_inference/Type";
import { ClassType } from "../type_inference/ClassType";
import { UnitType } from "../type_inference/UnitType";
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
            return new ClassType("module." + this.name);
        }
        return new UnitType(this.name);
    }
}
