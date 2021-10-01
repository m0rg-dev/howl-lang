import { Classes } from "../registry/Registry";
import { RawPointerType, Type } from "../type_inference/Type";
import { ConcreteType } from "../type_inference/ConcreteType";
import { ASTElement, SourceLocation } from "./ASTElement";
import { StructureType } from "../type_inference/StructureType";

export class SimpleTypeElement extends ASTElement {
    name: string;

    constructor(loc: SourceLocation, name: string) {
        super(loc);
        this.name = name;
    }

    toString() {
        return `$${this.name}`;
    }

    clone() {
        return new SimpleTypeElement(this.source_location, this.name);
    }

    asTypeObject(): Type {
        if (Classes.has(this.name)) {
            return Classes.get(this.name).type();
        }
        return new ConcreteType(this.name);
    }
}

export class TypeElement extends ASTElement {
    source: SimpleTypeElement;
    generics: TypeElement[];
    override: Type;

    constructor(loc: SourceLocation, source: SimpleTypeElement, generics: TypeElement[]) {
        super(loc);
        this.source = source;
        this.generics = generics;
    }

    toString() {
        return `TE(${this.source})` + ((this.generics.length) ? `<${this.generics.join(", ")}>` : "");
    }

    clone() {
        return new TypeElement(this.source_location, this.source.clone(), this.generics.map(x => x.clone()));
    }

    asTypeObject(): Type {
        if (this.override) return this.override;
        const rctype = this.source.asTypeObject();
        if (rctype instanceof StructureType && Classes.has(rctype.fqn.toString())) {
            const cl = Classes.get(rctype.fqn.toString());
            cl.generics.forEach((x, y) => {
                if (this.generics[y]) {
                    rctype.generic_map.set(x, this.generics[y].asTypeObject());
                }
            });
        }

        return rctype;
    }

    asRawPointer(): RawPointerElement {
        return new RawPointerElement(this.source_location, this.source.clone(), this.generics.map(x => x.clone()));
    }
}

export class RawPointerElement extends TypeElement {
    toString() {
        return `*${super.toString()}`;
    }

    asTypeObject(): RawPointerType {
        return new RawPointerType(super.asTypeObject());
    }
}