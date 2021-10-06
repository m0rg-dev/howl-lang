import { Classes } from "../registry/Registry";
import { FunctionType } from "../type_inference/FunctionType";
import { StructureType } from "../type_inference/StructureType";
import { ASTElement, SourceLocation } from "./ASTElement";
import { FunctionElement } from "./FunctionElement";
import { TypedItemElement } from "./TypedItemElement";

export class ClassElement extends ASTElement {
    name: string;
    parent: string;

    fields: TypedItemElement[];
    methods: FunctionElement[];
    generics: string[];
    is_monomorphization = false;

    constructor(loc: SourceLocation, name: string, fields: TypedItemElement[], methods: FunctionElement[], generics: string[], parent: string) {
        super(loc);
        this.name = name;
        this.fields = fields;
        this.methods = methods;
        this.generics = generics;
        this.parent = parent;

        if (!generics.length) this.is_monomorphization = true;
    }

    toString() {
        return `Class<${this.generics.join(", ")}>(${this.name})${this.parent ? ` extends ${this.parent}` : ""}`;
    }

    clone() {
        return new ClassElement(
            this.source_location,
            this.name,
            this.fields.map(x => x.clone()),
            this.methods.map(x => x.clone()),
            [...this.generics],
            this.parent
        );
    }

    private addFieldsToType(t: StructureType) {
        this.fields.forEach((x) => t.addField(x.name, x.type));
        this.methods.forEach((x) => t.addField(x.getFQN().last().split(".").pop(), new FunctionType(x)));
    }

    type(): StructureType {
        const t = new StructureType(this.name, new Set(this.generics));
        if (this.parent) {
            Classes.get(this.parent).addFieldsToType(t);
        }
        this.addFieldsToType(t);
        return t;
    }

    setName(n: string) {
        this.name = n;
    }

    hierarchyIncludes(name: string): boolean {
        if (this.name == name) return true;
        if (this.parent) {
            return Classes.get(this.parent).hierarchyIncludes(name);
        }
        return false;
    }

    // TODO check and make sure field names aren't aliased (but not here)
    synthesizeFields(): TypedItemElement[] {
        const rc: TypedItemElement[] = [];
        if (this.fields[0].name != "__stable") {
            throw new Error("can't synthesizeFields yet!");
        }

        rc.push(this.fields[0]);
        if (this.parent) {
            rc.push(...Classes.get(this.parent).synthesizeFields().slice(1));
        }
        rc.push(...this.fields.slice(1));
        return rc;
    }

    synthesizeMethods(): FunctionElement[] {
        const rc: FunctionElement[] = [];
        // this one is a little more complicated because methods CAN alias
        // but the order still matters

        if (this.parent) {
            rc.push(...Classes.get(this.parent).synthesizeMethods());
        }

        this.methods.forEach(m => {
            const idx = rc.findIndex(x => x.name.split(".").pop() == m.name.split(".").pop());
            if (idx >= 0) {
                rc[idx] = m;
            } else {
                rc.push(m);
            }
        });

        return rc;
    }
}
